import { resolve, join, dirname, relative } from 'path'
import type { SetRequired } from 'type-fest'
import { ViteDevServer, UserConfig as ViteConfig } from 'vite'
import resolveFrom from 'resolve-from'
import consola from 'consola'
import { loadConfig, SUPPORTED_CONFIG_FILES } from './utils/load-config'
import { loadPlugins } from './load-plugins'
import { PluginContext } from './plugin-context'
import { remove, existsSync } from 'fs-extra'
import { OWN_DIR } from './utils/constants'
import { ReamPlugin } from './types'

export interface Options {
  rootDir?: string
  srcDir?: string
  dev?: boolean
}

export type Route = {
  name?: string
  path: string
  file: string
  isServerRoute: boolean
  children?: Route[]
}

export type ReamConfig = {
  env?: {
    [envName: string]: string | number | boolean
  }
  plugins?: Array<ReamPlugin>
  modules?: string[]
  imports?: string[]
  hmr?: {
    host?: string
    port?: number
  }
  vue?: {
    runtimeTemplateCompiler?: boolean
  }
  vite?: (viteConfig: ViteConfig, opts: { dev: boolean; ssr?: boolean }) => void
  routes?: (defaultRoutes: Route[]) => Promise<Route[]> | Route[]
}

export const defineReamConfig = (config: ReamConfig) => config

export class Ream {
  rootDir: string
  srcDir: string
  isDev: boolean
  inlineConfig: ReamConfig
  config!: SetRequired<ReamConfig, 'env' | 'plugins' | 'imports'>
  configPath?: string
  pluginContext: PluginContext
  viteDevServer?: ViteDevServer

  constructor(options: Options = {}, inlineConfig: ReamConfig = {}) {
    this.inlineConfig = inlineConfig
    this.rootDir = resolve(options.rootDir || '.')
    if (options.srcDir) {
      this.srcDir = join(this.rootDir, options.srcDir)
    } else {
      const hasPagesInSrc = existsSync(join(this.rootDir, 'src/pages'))
      this.srcDir = hasPagesInSrc ? join(this.rootDir, 'src') : this.rootDir
    }
    this.isDev = Boolean(options.dev)
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = this.isDev ? 'development' : 'production'
    }
    this.pluginContext = new PluginContext(this)
  }

  resolveRootDir(...args: string[]) {
    return resolve(this.rootDir, ...args)
  }

  resolveSrcDir(...args: string[]) {
    return resolve(this.srcDir, ...args)
  }

  resolveDotReam(...args: string[]) {
    return this.resolveRootDir('.ream', ...args)
  }

  resolveOwnDir(...args: string[]) {
    return resolve(OWN_DIR, ...args)
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
      ...this.inlineConfig,
      ...projectConfig,
      env: {
        ...projectConfig.env,
        ...this.inlineConfig.env,
      },
      plugins: [
        ...(this.inlineConfig.plugins || []),
        ...(projectConfig.plugins || []),
      ],
      imports: projectConfig.imports || [],
    }
  }

  async prepare({
    shouldCleanDir,
    shouldPrepreFiles,
  }: {
    shouldCleanDir: boolean
    shouldPrepreFiles: boolean
  }) {
    await this.loadConfig()

    this.pluginContext.reset()

    await loadPlugins(this)

    if (shouldCleanDir) {
      // Remove everything but cache
      await Promise.all(
        ['templates', 'manifest', 'server', 'client', 'export', 'meta'].map(
          (name) => {
            return remove(this.resolveDotReam(name))
          }
        )
      )
    }

    if (shouldPrepreFiles) {
      consola.info('Preparing Ream files')
      const { prepareFiles } = await import('./prepare-files')
      await prepareFiles(this)
    }

    if (this.isDev) {
      // Create Vite dev server
      const { createServer: createViteServer } = await import('vite')
      const { getViteConfig } = await import('./vite/get-vite-config')
      const viteConfig = getViteConfig(this)
      const viteDevServer = await createViteServer(viteConfig)
      this.viteDevServer = viteDevServer

      // Reuse Vite watcher to register `onFileChange` callbacks
      for (const callback of this.pluginContext.hookCallbacks.onFileChange) {
        viteDevServer.watcher.on('all', callback)
      }

      // Restart Ream when config file changes
      viteDevServer.watcher.on('all', async (_, file) => {
        const files = SUPPORTED_CONFIG_FILES.map((name) =>
          this.resolveRootDir(name)
        )
        if (file === this.configPath || files.includes(file)) {
          consola.info(`Restarting Ream due to changes in ${file}`)
          await viteDevServer.close()
          await this.prepare({ shouldCleanDir, shouldPrepreFiles })
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
    await this.prepare({
      shouldCleanDir: this.isDev,
      shouldPrepreFiles: this.isDev,
    })
    const { getRequestHandler } = await import('./server')
    const handler = await getRequestHandler(this)
    return handler
  }

  async build({
    fullyExport,
    standalone,
  }: {
    fullyExport?: boolean
    standalone?: boolean
  }) {
    await this.prepare({ shouldCleanDir: true, shouldPrepreFiles: true })
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
