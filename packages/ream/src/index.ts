import { resolve, dirname, relative } from 'path'
import type { MarkRequired } from 'ts-essentials'
import { ViteDevServer, UserConfig as ViteConfig, loadEnv } from 'vite'
import resolveFrom from 'resolve-from'
import consola from 'consola'
import { loadConfig, SUPPORTED_CONFIG_FILES } from './utils/load-config'
import { remove } from 'fs-extra'
import { ReamPlugin, Route } from './types'
import { routesPlugin } from './plugins/routes-plugin'
import { Store } from './store'
import { PluginContext } from './plugin-context'

export type { PluginContext } from './plugin-context'

export { normalizePath } from './utils/normalize-path'
export interface Options {
  rootDir?: string
  dev?: boolean
  mode?: string
}

export * from './types'

export type ReamConfig = {
  /**
   * The directory to load `pages`, `api`, `ream-app.js` etc
   * Defaults to root dir (`.`)
   */
  srcDir?: string
  env?: Record<string, string>
  plugins?: Array<ReamPlugin>
  imports?: string[]
  hmr?: {
    host?: string
    port?: number
  }
  ssr?: boolean
  vite?: (viteConfig: ViteConfig, opts: { dev: boolean }) => void
  apiRoutes?: (defaultRoutes: Route[]) => Promise<Route[]> | Route[]
  clientRoutes?: (defaultRoutes: Route[]) => Promise<Route[]> | Route[]
}

export const defineConfig = (config: ReamConfig) => config

export class Ream {
  rootDir: string
  isDev: boolean
  inlineConfig: ReamConfig
  config!: MarkRequired<ReamConfig, 'env' | 'plugins' | 'imports'>
  configPath?: string
  viteServer?: ViteDevServer
  userEnv!: Record<string, string>
  mode: string
  store: Store
  plugins: { plugin: ReamPlugin; context: PluginContext }[]

  constructor(options: Options = {}, inlineConfig: ReamConfig = {}) {
    this.inlineConfig = inlineConfig
    this.rootDir = resolve(options.rootDir || '.')
    this.isDev = Boolean(options.dev)
    this.mode = options.mode || (this.isDev ? 'development' : 'production')
    this.store = new Store(this)
    this.plugins = []
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = this.isDev ? 'development' : 'production'
    }
  }

  resolveRootDir(...args: string[]) {
    return resolve(this.rootDir, ...args)
  }

  resolveSrcDir(...args: string[]) {
    if (!this.config.srcDir)
      throw new Error(`srcDir is only available after loading config file`)
    return this.resolveRootDir(this.config.srcDir, ...args)
  }

  resolveDotReam(...args: string[]) {
    return this.resolveRootDir('.ream', ...args)
  }

  resolveInPackage(pkg: string, target: string) {
    const pkgDir = dirname(resolveFrom(process.cwd(), `${pkg}/package.json`))
    return resolveFrom(pkgDir, target)
  }

  async loadConfig() {
    const { data: projectConfig = {}, path: configPath } = await loadConfig(
      this.rootDir
    )
    if (configPath) {
      consola.info(`Using config file: ${relative(process.cwd(), configPath)}`)
    }
    this.configPath = configPath
    this.config = {
      srcDir: '.',
      ...this.inlineConfig,
      ...projectConfig,
      env: {
        ...projectConfig.env,
        ...this.inlineConfig.env,
      },
      plugins: [
        routesPlugin(),
        ...(this.inlineConfig.plugins || []),
        ...(projectConfig.plugins || []),
      ],
      imports: projectConfig.imports || [],
    }
  }

  get env(): Record<string, string> {
    return {
      ...this.userEnv,
      ...this.config.env,
      REAM_SOURCE_DIR: this.resolveSrcDir(),
      REAM_ROOT_DIR: this.resolveRootDir(),
    }
  }

  get constants(): Record<string, string> {
    const { env } = this
    return {
      ...this.store.state.constants,
      ...Object.keys(env).reduce((res, key) => {
        const value = JSON.stringify(env[key])
        return {
          ...res,
          [`import.meta.env.${key}`]: value,
          [`process.env.${key}`]: value,
        }
      }, {}),
      REAM_SSR_ENABLED: JSON.stringify(this.config.ssr !== false),
    }
  }

  getPlugins() {
    return this.config.plugins.map((plugin) => {
      const context = new PluginContext(this, plugin.name)
      return {
        plugin,
        context,
      }
    })
  }

  async prepare() {
    this.store.resetState()

    await this.loadConfig()

    this.userEnv = loadEnv(this.mode, this.rootDir, 'REAM_')

    this.plugins = this.getPlugins()

    // Remove everything but cache
    await Promise.all(
      ['generated', 'server', 'client'].map((name) => {
        return remove(this.resolveDotReam(name))
      })
    )

    consola.info('Preparing Ream files')
    const { prepareFiles } = await import('./prepare-files')
    await prepareFiles(this)

    if (this.isDev) {
      // Create Vite dev server
      const { createServer: createViteServer } = await import('vite')
      const { getViteConfig } = await import('./vite/get-vite-config')
      const viteConfig = getViteConfig(this)
      const viteServer = await createViteServer(viteConfig)
      if (this.viteServer) {
        // Properly restart vite server
        // Ref: https://github.com/vitejs/vite/blob/23f57ee8785aa377ea4b0834d36af86503a742c0/packages/vite/src/node/server/hmr.ts#L419
        for (const key in viteServer) {
          if (key !== 'app') {
            // @ts-expect-error
            this.viteServer[key] = viteServer[key]
          }
        }
      } else {
        this.viteServer = viteServer
      }

      // Reuse Vite watcher to register `onFileChange` callbacks
      for (const plugin of this.plugins) {
        if (plugin.plugin.onFileChange) {
          viteServer.watcher.on(
            'all',
            plugin.plugin.onFileChange.bind(plugin.context)
          )
        }
      }

      // Restart Ream when config file changes
      viteServer.watcher.on('all', async (_, file) => {
        const files = SUPPORTED_CONFIG_FILES.map((name) =>
          this.resolveRootDir(name)
        )
        if (file === this.configPath || files.includes(file)) {
          consola.info(`Restarting Ream due to changes in ${file}`)
          await viteServer.close()
          await this.prepare()
        }
      })
    }
  }

  localResolve(name: string) {
    return resolveFrom.silent(this.rootDir, name)
  }

  localRequire(name: string) {
    const path = this.localResolve(name)
    return path && require(path)
  }

  async getRequestHandler() {
    if (this.isDev) {
      await this.prepare()

      const { getRequestHandler } = await import('./server/dev-server')
      return getRequestHandler(this)
    }

    const { createHandler } = await import('./server')

    const { handler } = await createHandler({
      dev: this.isDev,
      cwd: this.rootDir,
    })
    return handler
  }

  async build({
    fullyExport,
    standalone,
  }: {
    fullyExport?: boolean
    standalone?: boolean
  }) {
    await this.prepare()
    const { build, buildStandalone } = await import('./build')
    await build(this)
    // Export static pages
    const { exportSite } = await import('./export')
    await exportSite(this.resolveDotReam(), fullyExport)
    if (standalone) {
      await buildStandalone(this)
    }
  }
}

export * from './types'
