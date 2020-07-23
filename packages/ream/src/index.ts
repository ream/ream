import { resolve } from 'path'
import resolveFrom from 'resolve-from'
import { Route } from './utils/route'
import { pathToRoute } from './utils/path-to-routes'
import { sortRoutesByScore } from './utils/rank-routes'
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
  /**
   * Routes metadata
   * This property won't be available in a production server and isn't actual routes, use `.routes` instead
   */
  _routes: Route[]
  prepareType?: 'serve' | 'build' | 'export'
  config: Required<ReamConfig>
  configPath?: string
  store: Store

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
    this._routes = []
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
    // Use pre-generated file in production server or exporting
    if (
      this.prepareType === 'export' ||
      (this.prepareType === 'serve' && !this.isDev)
    ) {
      return require(this.resolveDotReam('manifest/routes-info.json'))
    }
    const routes: Route[] = [...this._routes]

    const ownPagesDir = this.resolveVueApp('pages')
    const patterns = [
      {
        require: (route: Route) => route.entryName === 'pages/_error',
        filename: '_error.js',
      },
      {
        require: (route: Route) => route.entryName === 'pages/_app',
        filename: '_app.js',
      },
      {
        require: (route: Route) => route.entryName === 'pages/_document',
        filename: '_document.js',
      },
      {
        require: (route: Route) => route.entryName === 'pages/404',
        filename: '404.js',
      },
    ]
    for (const pattern of patterns) {
      if (!routes.some(pattern.require)) {
        routes.push(pathToRoute(pattern.filename, ownPagesDir, routes.length))
      }
    }
    return sortRoutesByScore(routes)
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

  async prepare() {
    if (!this.prepareType) {
      throw new Error(`You cannot call .prepare() directly`)
    }

    // Plugins are loaded in every situations
    await loadPlugins(this)

    // Preparing for webpack build process
    if (
      this.prepareType === 'build' ||
      (this.prepareType === 'serve' && this.isDev)
    ) {
      // Remove everything but cache
      await Promise.all(
        ['templates', 'manifest', 'server', 'client'].map((name) => {
          return remove(this.resolveDotReam(name))
        })
      )

      const { prepareFiles } = await import('./prepare-files')
      await prepareFiles(this)
    }

    // Remove out dir for exporting
    if (this.prepareType === 'export') {
      await remove(this.resolveDotReam('out'))
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
    this.prepareType = 'serve'
    await this.prepare()
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
    this.prepareType = 'build'
    await this.prepare()
    const { build } = await import('./build')
    return build(this)
  }

  async export() {
    this.prepareType = 'export'
    await this.prepare()
    const { exportSite } = await import('./export')
    await exportSite()
  }
}

export * from './types'
