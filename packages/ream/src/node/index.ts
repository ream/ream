import path from 'path'
import type { MarkRequired } from 'ts-essentials'
import { ViteDevServer, UserConfig as ViteConfig, loadEnv } from 'vite'
import resolveFrom from 'resolve-from'
import consola from 'consola'
import { loadConfig, SUPPORTED_CONFIG_FILES } from './utils/load-config'
import fs from 'fs-extra'
import { ReamPlugin } from './types'
import { getInitialState, State } from './state'
import { getDirname } from './utils/dirname'
import { ServerEntry } from './server'
import { preparePlugin } from './plugins/prepare'

export interface Options {
  rootDir?: string
  srcDir?: string
  dev?: boolean
  mode?: string
}

export type Route = {
  name?: string
  path: string
  file: string
  isServerRoute: boolean
  children?: Route[]
}

export type ReamConfig = {
  env?: Record<string, string>
  plugins?: Array<ReamPlugin>
  imports?: string[]
  hmr?: {
    host?: string
    port?: number
  }
  vite?: (viteConfig: ViteConfig, opts: { dev: boolean }) => void
  routes?: (defaultRoutes: Route[]) => Promise<Route[]> | Route[]
}

export const defineReamConfig = (config: ReamConfig) => config

export const OWN_DIR = path.join(getDirname(import.meta.url), '../')

export const resolveOwnDir = (...args: string[]) =>
  path.resolve(OWN_DIR, ...args)

export class Ream {
  state!: State
  rootDir: string
  srcDir: string
  isDev: boolean
  inlineConfig: ReamConfig
  config!: MarkRequired<ReamConfig, 'env' | 'plugins' | 'imports'>
  configPath?: string
  viteDevServer?: ViteDevServer
  userEnv!: Record<string, string>
  mode: string

  constructor(options: Options = {}, inlineConfig: ReamConfig = {}) {
    this.inlineConfig = inlineConfig
    this.rootDir = path.resolve(options.rootDir || '.')
    if (options.srcDir) {
      this.srcDir = path.join(this.rootDir, options.srcDir)
    } else {
      const hasPagesInSrc = fs.existsSync(path.join(this.rootDir, 'src/pages'))
      this.srcDir = hasPagesInSrc
        ? path.join(this.rootDir, 'src')
        : this.rootDir
    }
    this.isDev = Boolean(options.dev)
    this.mode = options.mode || (this.isDev ? 'development' : 'production')
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = this.isDev ? 'development' : 'production'
    }
  }

  resolveRootDir(...args: string[]) {
    return path.resolve(this.rootDir, ...args)
  }

  resolveSrcDir(...args: string[]) {
    return path.resolve(this.srcDir, ...args)
  }

  resolveDotReam(...args: string[]) {
    return this.resolveRootDir('.ream', ...args)
  }

  resolveInPackage(pkg: string, target: string) {
    const pkgDir = path.dirname(
      resolveFrom(process.cwd(), `${pkg}/package.json`)
    )
    return resolveFrom(pkgDir, target)
  }

  async loadConfig() {
    const { config = {}, path: configPath } = await loadConfig(this.rootDir)
    if (configPath) {
      consola.info(
        `Using config file: ${path.relative(process.cwd(), configPath)}`
      )
    }
    this.configPath = configPath
    this.config = {
      ...this.inlineConfig,
      ...config,
      env: {
        ...config.env,
        ...this.inlineConfig.env,
      },
      plugins: [
        preparePlugin(),
        ...(this.inlineConfig.plugins || []),
        ...(config.plugins || []),
      ],
      imports: config.imports || [],
    }
  }

  get env(): Record<string, string> {
    return {
      ...this.userEnv,
      ...this.config.env,
    }
  }

  get constants(): Record<string, string> {
    const { env } = this
    const srcDir = path.relative(process.cwd(), this.resolveSrcDir()) || '.'
    const rootDir = path.relative(process.cwd(), this.resolveRootDir()) || '.'
    return {
      ...this.state.constants,
      ...Object.keys(env).reduce((res, key) => {
        const value = JSON.stringify(env[key])
        return {
          ...res,
          [`import.meta.env.${key}`]: value,
          [`process.env.${key}`]: value,
        }
      }, {}),
      REAM_SOURCE_DIR: JSON.stringify(srcDir),
      REAM_ROOT_DIR: JSON.stringify(rootDir),
    }
  }

  ensureEnv(name: string, defaultValue?: string) {
    const value = this.env[name]
    if (!value && !defaultValue) {
      throw new Error(`Environment variable "${name}" is required`)
    }
    return value || defaultValue
  }

  async prepare({
    shouldCleanDir,
    shouldPrepreFiles,
  }: {
    shouldCleanDir: boolean
    shouldPrepreFiles: boolean
  }) {
    this.state = getInitialState()

    await this.loadConfig()

    this.userEnv = loadEnv(this.mode, this.rootDir, 'REAM_')

    if (shouldCleanDir) {
      // Remove everything but cache
      await Promise.all(
        ['templates', 'manifest', 'server', 'client', 'export', 'meta'].map(
          (name) => {
            return fs.remove(this.resolveDotReam(name))
          }
        )
      )
    }

    for (const plugin of this.config.plugins) {
      if (plugin.prepare) {
        await plugin.prepare.call(this)
      }
    }

    if (this.isDev) {
      // Create Vite dev server
      const { createServer: createViteServer } = await import('vite')
      const { getViteConfig } = await import('./vite/get-vite-config')
      const viteConfig = getViteConfig(this)
      const viteDevServer = await createViteServer(viteConfig)

      if (this.viteDevServer) {
        // Properly restart vite server
        // Ref: https://github.com/vitejs/vite/blob/23f57ee8785aa377ea4b0834d36af86503a742c0/packages/vite/src/node/server/hmr.ts#L419
        for (const key in viteDevServer) {
          if (key !== 'app') {
            // @ts-expect-error
            this.viteDevServer[key] = viteDevServer[key]
          }
        }
      } else {
        this.viteDevServer = viteDevServer
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

      // Reuse Vite watcher to register `onFileChange` callbacks
      for (const plugin of this.config.plugins) {
        if (plugin.onFileChange) {
          viteDevServer.watcher.on('all', plugin.onFileChange)
        }
      }
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

    if (this.isDev) {
      const { getRequestHandler } = await import('./dev-server')
      return getRequestHandler(this)
    }
    const { createHandler } = await import('./server')

    const serverAssets = await getServerAssets(this.resolveDotReam())
    return createHandler({
      cwd: this.rootDir,
      ...serverAssets,
    })
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

const readJSON = (filepath: string) =>
  JSON.parse(fs.readFileSync(filepath, 'utf8'))

export const getServerAssets = async (dotReamDir: string) => {
  const serverEntry: ServerEntry = await import(
    path.join(dotReamDir, 'server/server-entry.js')
  )
  const ssrManifest = readJSON(
    path.join(dotReamDir, 'manifest/ssr-manifest.json')
  )

  const clientManifest = readJSON(
    path.join(dotReamDir, 'manifest/client-manifest.json')
  )
  let exportManifest: Record<string, any> | undefined
  try {
    exportManifest = readJSON(
      path.join(dotReamDir, 'manifest/export-manifest.json')
    )
  } catch (_) {}
  const htmlTemplate = fs.readFileSync(
    path.join(dotReamDir, 'client/index.html'),
    'utf8'
  )
  return {
    serverEntry,
    ssrManifest,
    clientManifest,
    exportManifest,
    htmlTemplate,
  }
}
