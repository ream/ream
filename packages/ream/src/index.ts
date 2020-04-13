import 'source-map-support/register'
import { resolve } from 'path'
import { Route } from '@ream/common/dist/route'

export type BuildTarget = 'server' | 'static'
export interface Options {
  dir?: string
  dev?: boolean
  cache?: boolean
  server?: {
    port?: number | string
  }
  target?: BuildTarget
}

type ServerOptions = {
  port: number | string
}

export class Ream {
  dir: string
  isDev: boolean
  shouldCache: boolean
  serverOptions: ServerOptions
  /**
   * Routes metadata
   * This property won't be available in a production server, use `.routes` instead
   */
  _routes: Route[]
  prepareType?: 'serve' | 'build'
  target: BuildTarget

  constructor(options: Options = {}) {
    this.dir = resolve(options.dir || '.')
    this.isDev = Boolean(options.dev)
    this.shouldCache = options.cache !== false
    this.serverOptions = {
      port: options.server?.port || '3000',
    }
    this._routes = []
    this.target = options.target || 'server'
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

  resolveApp(...args: string[]) {
    return resolve(__dirname, '../app', ...args)
  }

  get routes(): Route[] {
    if (this.isDev) {
      return this._routes
    }
    return require(this.resolveDotReam('routes.json'))
  }

  get _appOutputPathForServer() {
    return this.resolveDotReam(`server/pages/_app.js`)
  }

  get _documentOutputPathForServer() {
    return this.resolveDotReam(`server/pages/_document.js`)
  }

  async getEntry(type: 'client' | 'server') {
    if (type === 'client') {
      return {
        main: [
          ...(this.isDev
            ? [require.resolve('webpack-hot-middleware/client')]
            : []),
          this.resolveApp('client.js'),
        ],
      }
    }
    return this.routes.reduce(
      (result, route) => {
        return {
          ...result,
          [route.entryName]: route.absolutePath,
        }
      },
      {
        // Defaults
        'pages/_app': this.resolveApp('pages/_app.js'),
        'pages/_document': this.resolveApp('pages/_document.js')
      }
    )
  }

  async prepare() {
    if (!this.prepareType) {
      throw new Error(`You cannot call .prepare() directly`)
    }

    if (
      this.prepareType === 'build' ||
      (this.prepareType === 'serve' && this.isDev)
    ) {
      const { prepareFiles } = await import('./prepare-files')
      await prepareFiles(this)
    }
  }

  async getRequestHandler() {
    this.prepareType = 'serve'
    await this.prepare()
    const { createServer } = await import('./server/create-server')
    const server = createServer(this)
    return server
  }

  async serve() {
    this.prepareType = 'serve'
    await this.prepare()
    const server = await this.getRequestHandler()
    server.listen(this.serverOptions.port)
    console.log(`> http://localhost:${this.serverOptions.port}`)
  }

  async build() {
    this.prepareType = 'build'
    await this.prepare()
    const res = await import('./build')
    return res.build(this)
  }
}
