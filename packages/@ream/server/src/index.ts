import path from 'path'
import type { Router } from 'vue-router'
import serveStatic from 'serve-static'
import { Server } from './server'
import { render, renderToHTML, getPreloadData } from './render'
import { createServerRouter } from './router'

export {
  ReamServerHandler,
  ReamServerRequest,
  ReamServerResponse,
} from './server'

export type GetDocumentArgs = {
  head(): string
  main(): string
  scripts(): string
  htmlAttrs(): string
  bodyAttrs(): string
}

export type ServerEntry = {
  render: any
  createClientRouter: (url: string) => Promise<Router>
  _document: () => Promise<{
    default: (args: GetDocumentArgs) => string | Promise<string>
  }>
  ErrorComponent: any
}

type LoadServerEntry = () => Promise<ServerEntry> | ServerEntry

type CreateServerContext = {
  /**
   * Development mode
   * @default {false}
   */
  dev?: boolean
  /**
   * Path to your project
   * i.e. the directory where we create the .ream folder
   * @default {`.ream`}
   */
  cwd?: string
  devMiddleware?: any
  loadServerEntry?: LoadServerEntry
  ssrFixStacktrace?: (err: Error) => void
}

export { render, renderToHTML, getPreloadData }

export const extractClientManifest = (dotReamDir: string) => {
  const clientManifest = require(path.join(
    dotReamDir,
    'manifest/client-manifest.json'
  ))
  for (const key of Object.keys(clientManifest)) {
    const value: any = clientManifest[key]
    if (value.isEntry) {
      return {
        scripts: `<script type="module" src="/${value.file}"></script>`,
        styles: value.css
          ? value.css.map(
              (name: string) => `<link rel="stylesheet" href="/${name}">`
            )
          : '',
      }
    }
  }
}

export async function createServer(ctx: CreateServerContext = {}) {
  const dotReamDir = path.resolve(ctx.cwd || '.', '.ream')

  const server = new Server()

  let ssrManifest: any
  let serverEntry: any
  let scripts = ''
  let styles = ''
  let serverRouter: Router | undefined

  const loadServerEntry: LoadServerEntry =
    ctx.loadServerEntry ||
    (() => require(path.join(dotReamDir, 'server/server-entry.js')).default)

  if (ctx.dev) {
    if (ctx.devMiddleware) {
      server.use(ctx.devMiddleware)
    }
    ssrManifest = {}
  } else {
    ssrManifest = require(path.join(dotReamDir, 'manifest/ssr-manifest.json'))
    const extractedAssets = extractClientManifest(dotReamDir)
    if (extractedAssets) {
      scripts = extractedAssets.scripts
      styles = extractedAssets.styles
    }

    const serveStaticFiles = serveStatic(path.join(dotReamDir, 'client'))
    server.use(serveStaticFiles as any)
  }

  server.use(async (req, res, next) => {
    if (ctx.dev || !serverEntry) {
      serverEntry = await loadServerEntry()
    }
    next()
  })

  server.use(async (req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      return next()
    }

    if (!serverRouter || ctx.dev) {
      serverRouter = createServerRouter(serverEntry.serverRoutes)
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
      ssrManifest,
      serverEntry,
      isPreloadRequest,
      dotReamDir,
      scripts,
      styles,
    })

    res.statusCode = result.statusCode
    for (const key in result.headers) {
      res.setHeader(key, result.headers[key])
    }
    res.send(result.body)
  })

  server.onError(async (err, req, res, next) => {
    if (ctx.ssrFixStacktrace) {
      ctx.ssrFixStacktrace(err)
    }
    console.error('server error', err.stack)

    try {
      const response = (err as any).response as Response | undefined
      if (response) {
        res.statusCode = response.status
      } else {
        res.statusCode =
          !res.statusCode || res.statusCode < 400 ? 500 : res.statusCode
      }
      const router = await serverEntry.createClientRouter(req.url)
      const ErrorComponent = await serverEntry.ErrorComponent.__asyncLoader()
      const preloadResult = await getPreloadData([ErrorComponent], {
        req,
        res,
        params: req.params,
      })
      const html = await renderToHTML({
        params: req.params,
        path: req.path,
        url: req.url,
        req,
        res,
        router,
        pageData: {
          ...preloadResult.data,
          error: {
            statusCode: res.statusCode,
            stack: ctx.dev ? err.stack : undefined,
          },
        },
        serverEntry,
        ssrManifest,
        scripts,
        styles,
      })
      res.setHeader('content-type', 'text-html')
      res.end(html)
    } catch (error) {
      res.statusCode = 500
      res.send(
        ctx.dev
          ? `<h1>Error occurs while rendering error page:</h1><pre>${error.stack}</pre>`
          : 'server error'
      )
    }
  })

  return server.handler
}
