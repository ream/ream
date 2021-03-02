import path from 'path'
import type { Router, RouteRecordRaw } from 'vue-router'
import type { HTMLResult as HeadResult } from '@vueuse/head'
import serveStatic from 'serve-static'
import type { GetDocument, Preload } from '@ream/app'
import { Server } from './server'
import { render, renderToHTML, getPreloadData, HtmlAssets } from './render'
import { ExportCache, getExportOutputPath } from './export-cache'
export {
  ReamServerHandler,
  ReamServerRequest,
  ReamServerResponse,
} from './server'

export { Connect } from './connect'

export type ServerEntry = {
  render: any
  createClientRouter: () => Router
  createServerRouter: (routes: RouteRecordRaw[]) => Router
  _document: () => Promise<{
    default: GetDocument
  }>
  renderHeadToString: (app: any) => HeadResult
  ErrorComponent: any
  serverRoutes: RouteRecordRaw[]
  clientRoutes: RouteRecordRaw[]
  getGlobalPreload: () => Promise<Preload | undefined>
}

export type ExportInfo = {
  /** The paths that have been exported at build time */
  staticPaths: string[]
  /** The raw paths that should fallback to render on demand */
  fallbackPathsRaw: string[]
}

export type GetHtmlAssets = (context: ServerContext) => HtmlAssets

type ServerContext = {
  serverEntry: ServerEntry
  getExportInfo?: () => ExportInfo
  ssrManifest?: any
  clientManifest?: any
}

type CreateServerOptions = {
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
  getHtmlAssets?: GetHtmlAssets
  ssrFixStacktrace?: (err: Error) => void
  context:
    | ServerContext
    | (() => ServerContext)
    | (() => Promise<ServerContext>)
}

export {
  render,
  renderToHTML,
  getPreloadData,
  ExportCache,
  getExportOutputPath,
}

export const productionGetHtmlAssets: GetHtmlAssets = (
  context: ServerContext
) => {
  const clientManifest = context.clientManifest
  for (const key of Object.keys(clientManifest)) {
    const value: any = clientManifest[key]
    if (value.isEntry) {
      return {
        scriptTags: `<script type="module" src="/${value.file}"></script>`,
        cssLinkTags: value.css
          ? value.css.map(
              (name: string) => `<link rel="stylesheet" href="/${name}">`
            )
          : '',
      }
    }
  }
  return { scriptTags: ``, cssLinkTags: `` }
}

export const start = async (
  cwd: string = '.',
  options: { host?: string; port?: number; context: ServerContext }
) => {
  const host = options.host || '0.0.0.0'
  const port = `${options.port || 3000}`

  if (!process.env.PORT) {
    process.env.PORT = port
  }

  process.env.NODE_ENV = 'production'

  const server = createServer({
    cwd,
    context: options.context,
  })
  // @ts-ignore
  server.listen(port, host)
  console.log(`> http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`)
}

export function createServer(options: CreateServerOptions) {
  const dotReamDir = path.resolve(options.cwd || '.', '.ream')
  const getHtmlAssets = options.getHtmlAssets || productionGetHtmlAssets
  const server = new Server()

  let assets: HtmlAssets
  // A vue-router instance for matching server routes (aka API routes)
  let serverRouter: Router | undefined
  let context: ServerContext
  let exportInfo: ExportInfo | undefined

  const exportCache = new ExportCache({
    exportDir: path.join(dotReamDir, 'client'),
    flushToDisk: true,
  })

  if (options.devMiddleware) {
    server.use(options.devMiddleware)
  }

  // Server static assets in production mode
  if (!options.dev) {
    const serveStaticFiles = serveStatic(path.join(dotReamDir, 'client'))
    server.use(serveStaticFiles as any)
  }

  server.use(async (req, res, next) => {
    if (options.dev || !context) {
      context =
        typeof options.context === 'function'
          ? await options.context()
          : options.context
      exportInfo = context.getExportInfo && context.getExportInfo()
    }
    assets = getHtmlAssets(context)
    next()
  })

  server.use(async (req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      return next()
    }

    if (!serverRouter || options.dev) {
      serverRouter = context.serverEntry.createServerRouter(
        context.serverEntry.serverRoutes
      )
    }

    serverRouter!.push(req.url)
    await serverRouter.isReady()
    const { matched } = serverRouter.currentRoute.value
    const route = matched[0]
    if (route.name === '404') {
      return next()
    }
    const mod = await route.meta.load()
    mod.default(req, res, next)
  })

  server.use(async (req, res, next) => {
    if (req.method !== 'GET') {
      return next()
    }

    const isPreloadRequest = req.path.endsWith('.preload.json')
    if (isPreloadRequest) {
      req.url = req.url.replace(/(\/index)?\.preload\.json/, '')
      if (req.url[0] !== '/') {
        req.url = `/${req.url}`
      }
    }
    const result = await render({
      url: req.url,
      req,
      res,
      isPreloadRequest,
      ssrManifest: context.ssrManifest,
      serverEntry: context.serverEntry,
      assets,
      exportInfo,
      exportCache,
    })

    if (result.redirect) {
      res.writeHead(result.redirect.permanent ? 301 : 302, {
        Location: result.redirect.url,
      })
      res.end()
    } else {
      res.statusCode = result.statusCode

      for (const key in result.headers) {
        res.setHeader(key, result.headers[key])
      }
      res.end(result.body)
    }
  })

  server.onError(async (err, req, res, next) => {
    if (options.ssrFixStacktrace) {
      options.ssrFixStacktrace(err)
    }
    console.error('server error', err.stack)

    try {
      res.statusCode =
        !res.statusCode || res.statusCode < 400 ? 500 : res.statusCode
      const router = context.serverEntry.createClientRouter()
      router.push(req.url)
      await router.isReady()
      const ErrorComponent = await context.serverEntry.ErrorComponent.__asyncLoader()
      const globalPreload = await context.serverEntry.getGlobalPreload()
      const preloadResult = await getPreloadData(
        globalPreload,
        [ErrorComponent],
        {
          req,
          res,
          params: req.params,
        }
      )
      preloadResult.error = {
        statusCode: res.statusCode,
        stack: options.dev ? err.stack : undefined,
      }
      const html = await renderToHTML({
        params: req.params,
        path: req.path,
        url: req.url,
        req,
        res,
        router,
        preloadResult,
        serverEntry: context.serverEntry,
        ssrManifest: context.ssrManifest,
        assets,
      })
      res.setHeader('content-type', 'text-html')
      res.end(html)
    } catch (error) {
      res.statusCode = 500
      res.send(
        options.dev
          ? `<h1>Error occurs while rendering error page:</h1><pre>${error.stack}</pre>`
          : 'server error'
      )
    }
  })

  return server.handler
}
