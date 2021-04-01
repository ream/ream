import path from 'path'
import http from 'http'
import type { MarkRequired } from 'ts-essentials'
import { ViteDevServer, UserConfig as ViteConfig, loadEnv } from 'vite'
import resolveFrom from 'resolve-from'
import consola from 'consola'
import { loadConfig, SUPPORTED_CONFIG_FILES } from './utils/load-config'
import fs from 'fs-extra'
import { ReamPlugin } from './types'
import { getInitialState, State } from './state'
import { ServerEntry } from './server'
import { preparePlugin } from './plugins/prepare'
import { getPort } from './utils/get-port'

export interface Options {
  rootDir?: string
  srcDir?: string
  dev?: boolean
  mode?: string
  host?: string
  port?: number
}

export type Route = {
  name?: string
  path: string
  file: string
  isEndpoint: boolean
  children?: Route[]
}

export interface Endpoint extends Route {
  isEndpoint: true
  children: undefined
}

export type ReamConfig = {
  env?: Record<string, string>
  plugins?: Array<ReamPlugin>
  imports?: string[]
  vite?: (viteConfig: ViteConfig, opts: { dev: boolean }) => void
  pages?: (this: Ream, defaultPages: Route[]) => Promise<Route[]> | Route[]
  endpoints?: (
    this: Ream,
    defaultEndpoints: Endpoint[]
  ) => Promise<Endpoint[]> | Endpoint[]
  hmr?: {
    /**
     * Configure the port that hmr client connects to
     *
     * Note that this doesn't affect which port the server listens to,
     * the actual server port is alway the value of `--port`
     *
     * You might set this to `443` if you're running Ream dev server on repl.it
     * or other cloud IDEs.
     */
    port?: number
  }
}

export const defineReamConfig = (config: ReamConfig) => config

export const OWN_DIR = path.join(__dirname, '../')

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
  host?: string
  port?: number
  _devServer?: http.Server

  constructor(options: Options, inlineConfig: ReamConfig = {}) {
    this.inlineConfig = inlineConfig
    this.rootDir = path.resolve(options.rootDir || '.')
    this.host = options.host
    this.port = options.port
    if (options.srcDir) {
      this.srcDir = path.join(this.rootDir, options.srcDir)
    } else {
      const hasRoutesInSrc = fs.existsSync(
        path.join(this.rootDir, 'src/routes')
      )
      this.srcDir = hasRoutesInSrc
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

  async prepare(type: 'build' | 'dev' | 'start') {
    this.state = getInitialState()

    if (type !== 'build') {
      const { port, host } = await getPort(this.host, this.port)
      this.host = host
      this.port = port
    }

    if (type !== 'start') {
      await this.loadConfig()

      await Promise.all(
        ['templates', 'manifest', 'server', 'client', 'export'].map((name) => {
          return fs.remove(this.resolveDotReam(name))
        })
      )
    }

    this.userEnv = loadEnv(this.mode, this.rootDir, 'REAM_')

    if (type !== 'start') {
      // Call plugin prepare hook
      for (const plugin of this.config.plugins) {
        if (plugin.prepare) {
          await plugin.prepare.call(this)
        }
      }
    }

    if (type === 'dev') {
      // Create Vite dev server
      // Create a temp dev server to use as Vite hmr server
      this._devServer = http.createServer()
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
          await this.prepare(type)
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
    await this.prepare(this.isDev ? 'dev' : 'start')

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

  async startServer() {
    const handler = await this.getRequestHandler()
    const server = this._devServer || http.createServer()
    server.on('request', handler)
    server.listen(this.port, this.host)
    console.log(`> Open http://${this.host}:${this.port}`)
  }

  async build({
    fullyExport,
    standalone,
  }: {
    fullyExport?: boolean
    standalone?: boolean
  }) {
    await this.prepare('build')
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
