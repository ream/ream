import fs from 'fs'
import path from 'path'
import serveStatic from 'sirv'
import serializeJavascript from 'serialize-javascript'
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
import { Render } from '../app'

// Re-export hook types
export * from './hooks'

export { Connect } from './connect'

export type ApiRoute = { path: string; load: () => Promise<{ default: any }> }

export type TransformIndexHTML = (url: string, html: string) => Promise<string>

export interface ServerExports {
  apiRoutes: ApiRoute[]
  serverRender: Render
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
    initialState: Record<string, any>
  }
) => void | Promise<void>

const defaultApiHandler: ExtendServer = async (server, { serverExports }) => {
  for (const route of serverExports.apiRoutes) {
    server.use(route.path, await route.load().then((res) => res.default))
  }
}

const defaultAppHandler: ExtendServer = async (
  server,
  { serverExports, htmlTemplatePath, transformIndexHTML, initialState }
) => {
  debug.request('called default app handler')

  const htmlTemplate = await fs.promises.readFile(htmlTemplatePath, 'utf8')

  const MAIN_PLACEHOLDER = `<!--ream-main-->`
  const HEAD_PLACEHOLDER = `<!--ream-head-->`
  const HTML_ATTRS_PLACEHOLDER = ` ream-html-attrs`
  const BODY_ATTRS_PLACEHOLDER = ` ream-body-attrs`

  server.use(async (req: ReamServerRequest, res: ReamServerResponse) => {
    let html = htmlTemplate
    if (transformIndexHTML) {
      html = await transformIndexHTML(req.url, html)
    }
    const result = await serverExports.serverRender({
      url: req.url,
      routes: [],
      initialState,
    })

    html = html.replace(
      MAIN_PLACEHOLDER,
      `
    ${MAIN_PLACEHOLDER}
    <script>INITIAL_STATE=${serializeJavascript(initialState, {
      isJSON: true,
    })}</script>`
    )
    if (result) {
      html = html
        .replace(HTML_ATTRS_PLACEHOLDER, result.htmlAttrs || '')
        .replace(BODY_ATTRS_PLACEHOLDER, result.bodyAttrs || '')
        .replace(HEAD_PLACEHOLDER, result.head || '')
        .replace(MAIN_PLACEHOLDER, result.html || '<div id="_ream"></div>')
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
    initialState: {},
  }
  await apiHandler(server, context)
  await appHandler(server, context)

  return { handler: server.handler }
}
