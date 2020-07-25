import { resolve } from 'path'
import resolveFrom from 'resolve-from'
import { Route } from './utils/route'
import { loadConfig } from './utils/load-config'
import { loadPlugins } from './load-plugins'
import { normalizePluginsArray } from './utils/normalize-plugins-array'
import { Store, store } from './store'
import { ChainWebpack } from './types'
import { createServer } from 'http'
import { Entry } from 'webpack'
import { remove } from 'fs-extra'

export interface Options {
  dir?: string
  dev?: boolean
  cache?: boolean
  server?: {
    port?: number | string
  }
}

type ServerOptions = {
  port: string
}

export type ReamPluginConfigItem =
  | string
  | [string]
  | [string, { [k: string]: any }]

export type ReamConfig = {
  env?: {
    [k: string]: string | boolean | number
  }
  plugins?: Array<ReamPluginConfigItem>
  chainWebpack?: ChainWebpack
  css?: string[]
}

export class Ream {
  dir: string
  isDev: boolean
  shouldCache: boolean
  serverOptions: ServerOptions
  config: Required<ReamConfig>
  configPath?: string
  store: Store
  // Used by `export` command, addtional routes like server routes and *.serverpreload.json
  exportedServerRoutes?: Set<string>

  constructor(options: Options = {}, configOverride: ReamConfig = {}) {
    this.dir = resolve(options.dir || '.')
    this.isDev = Boolean(options.dev)
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = this.isDev ? 'development' : 'production'
    }
    this.shouldCache = options.cache !== false
    this.serverOptions = {
      port: String(options.server?.port || '3000'),
    }
    this.store = store

    process.env.PORT = this.serverOptions.port

    const { data: projectConfig = {}, path: configPath } = loadConfig(this.dir)
    this.configPath = configPath
    this.config = {
      env: {
        ...projectConfig.env,
        ...configOverride.env,
      },
      plugins: [
        ...(configOverride.plugins || []),
        ...(projectConfig.plugins || []),
      ],
      chainWebpack(chain, options) {
        if (projectConfig.chainWebpack) {
          projectConfig.chainWebpack(chain, options)
        }
        if (configOverride.chainWebpack) {
          configOverride.chainWebpack(chain, options)
        }
      },
      css: projectConfig.css || [],
    }
  }

  invalidate() {
    // noop
  }

  resolveRoot(...args: string[]) {
    return resolve(this.dir, ...args)
  }

  resolveDotReam(...args: string[]) {
    return resolve(this.dir, '.ream', ...args)
  }

  resolveVueApp(...args: string[]) {
    return resolve(__dirname, '../vue-app', ...args)
  }

  get routes(): Route[] {
    return require(this.resolveDotReam('manifest/routes-info.json'))
  }

  get plugins() {
    return normalizePluginsArray(this.config.plugins, this.dir)
  }

  async getEntry(isClient: boolean): Promise<Entry> {
    if (isClient) {
      return {
        main: [
          ...(this.isDev
            ? [require.resolve('webpack-hot-middleware/client')]
            : []),
          this.resolveVueApp('client-entry.js'),
        ],
      }
    }
    return {
      main: this.resolveVueApp('server-entry.js'),
    }
  }

  async prepare({
    shouldCleanDir,
    shouldPrepreFiles,
  }: {
    shouldCleanDir: boolean
    shouldPrepreFiles: boolean
  }) {
    // Plugins are loaded in every situations
    // TODO: some plugins should only be loaded at build time
    await loadPlugins(this)

    if (shouldCleanDir) {
      // Remove everything but cache
      await Promise.all(
        ['templates', 'manifest', 'server', 'client', 'export'].map((name) => {
          return remove(this.resolveDotReam(name))
        })
      )
    }

    // Preparing for webpack build process
    if (shouldPrepreFiles) {
      console.log('Preparing Ream files')
      const { prepareFiles } = await import('./prepare-files')
      await prepareFiles(this)
    }
  }

  localResolve(name: string) {
    return resolveFrom.silent(this.dir, name)
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
    const { getRequestHandler } = await import('./server/create-server')
    const server = await getRequestHandler(this)
    return server
  }

  async serve() {
    const handler = await this.getRequestHandler()
    const server = createServer(handler)
    server.listen(this.serverOptions.port)
    console.log(`> http://localhost:${this.serverOptions.port}`)
    return server
  }

  async build() {
    await this.prepare({ shouldCleanDir: true, shouldPrepreFiles: true })
    const { build } = await import('./build')
    return build(this)
  }

  async export() {
    await this.prepare({ shouldCleanDir: false, shouldPrepreFiles: false })
    const { exportSite } = await import('./export')
    await exportSite(this)
  }
}

export * from './types'
