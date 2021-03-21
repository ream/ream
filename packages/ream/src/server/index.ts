import fs from 'fs'
import path from 'path'
import serveStatic from 'sirv'
import {
  createServer as createHttpServer,
  ReamServer,
  ReamServerRequest,
  ReamServerResponse,
} from './server'
import { GetInitialHTML } from './hooks'
import type { ViteDevServer } from 'vite'
export type {
  ReamServerHandler,
  ReamServerRequest,
  ReamServerResponse,
} from './server'
import { debug } from '../debug'

// Re-export hook types
export * from './hooks'

export { Connect } from './connect'

export type ApiRoute = { path: string; load: () => Promise<{ default: any }> }

export type TransformIndexHTML = (url: string, html: string) => Promise<string>

export type ServerRenderContext = { url: string }
export interface ServerExports {
  apiRoutes: ApiRoute[]
  serverRender: (
    renderContext: ServerRenderContext
  ) => Promise<undefined | null | { html: string }>
  serverHandler?: { default: ExtendServer }
  appHandler?: { default: ExtendServer }
  enhanceApp: {
    callAsync: (name: string, context: any) => Promise<void>
  }
  enhanceServer: {
    hasExport: (name: string) => boolean
    getInitialHTML: GetInitialHTML
    callAsync: (name: string, context: any) => Promise<void>
  }
}

type CreateServerOptions = {
  viteServer?: ViteDevServer
  /**
   * Development mode
   * @default {false}
   */
  dev?: boolean
  /**
   * Path to your project
   */
  cwd?: string
  devMiddleware?: any
  fixStacktrace?: (err: Error) => void
  htmlTemplatePath?: string
}

type ExtendServer = (
  server: ReamServer,
  context: {
    serverExports: ServerExports
    htmlTemplatePath: string
    transformIndexHTML?: TransformIndexHTML
  }
) => void | Promise<void>

const defaultApiHandler: ExtendServer = async (server, { serverExports }) => {
  for (const route of serverExports.apiRoutes) {
    server.use(route.path, await route.load().then((res) => res.default))
  }
}

const defaultAppHandler: ExtendServer = async (
  server,
  { serverExports, htmlTemplatePath, transformIndexHTML }
) => {
  debug.request('called default app handler')

  const htmlTemplate = await fs.promises.readFile(htmlTemplatePath, 'utf8')

  server.use(async (req: ReamServerRequest, res: ReamServerResponse) => {
    let html = htmlTemplate
    if (transformIndexHTML) {
      html = await transformIndexHTML(req.url, html)
    }
    const result = await serverExports.serverRender({ url: req.url })
    if (result) {
      html = html.replace('<div id="_ream"></div>', result.html)
    }
    debug.request('sending html')
    res.send(html)
  })
}

export async function createHandler(options: CreateServerOptions) {
  const cwd = path.resolve(options.cwd || '.')
  const dotReamDir = path.join(cwd, '.ream')

  const server = createHttpServer()

  let serverExports: ServerExports

  const htmlTemplatePath = options.dev
    ? path.join(cwd, 'index.html')
    : path.join(dotReamDir, 'client/index.html')

  if (options.viteServer) {
    serverExports = await options.viteServer
      .ssrLoadModule('/.ream/generated/server-exports.js')
      .then((res) => {
        return res as any
      })
  } else {
    serverExports = require(path.join(dotReamDir, 'server/server-exports'))
  }

  if (options.devMiddleware) {
    server.use(options.devMiddleware)
  }

  // Server static assets in production mode
  if (!options.dev) {
    const serveStaticFiles = serveStatic(path.join(dotReamDir, 'client'))
    server.use((req, res, next) => {
      if (req.path === '/') return next()
      return serveStaticFiles(req, res, next)
    })
  }

  await serverExports.enhanceServer.callAsync('extendServer', {
    server,
  })

  const apiHandler = serverExports.serverHandler
    ? serverExports.serverHandler.default
    : defaultApiHandler
  const appHandler = serverExports.appHandler
    ? serverExports.appHandler.default
    : defaultAppHandler

  const context = {
    serverExports,
    htmlTemplatePath,
    transformIndexHTML: options.viteServer?.transformIndexHtml.bind(
      options.viteServer
    ),
  }
  await apiHandler(server, context)
  await appHandler(server, context)

  return { handler: server.handler }
}
