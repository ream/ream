import path from 'path'
import { FetchError } from '@ream/fetch'
import type { Router } from 'vue-router'
import { Server } from './server'
import { render, renderToHTML, getPreloadData } from './render'

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
   * Path to generated `.ream` folder
   * @default {`.ream`}
   */
  dotReamDir?: string
  devMiddleware?: any
  loadServerEntry?: LoadServerEntry
  ssrFixStacktrace?: (err: Error) => void
}

export async function createServer(ctx: CreateServerContext = {}) {
  const dotReamDir = path.resolve(ctx.dotReamDir || '.ream')

  const server = new Server()

  let ssrManifest: any
  let serverEntry: any

  const loadServerEntry: LoadServerEntry =
    ctx.loadServerEntry ||
    (() => require(path.join(dotReamDir, 'server/server-entry.js')).default)

  if (ctx.dev) {
    if (ctx.devMiddleware) {
      server.use(ctx.devMiddleware)
    }
    ssrManifest = {}
  } else {
    ssrManifest = require(path.join(dotReamDir, 'client/ssr-manifest.json'))
  }

  server.use(async (req, res, next) => {
    if (ctx.dev || !serverEntry) {
      serverEntry = await loadServerEntry()
    }
    next()
  })

  server.use(async (req, res, next) => {
    const isPreloadRequest = req.path.endsWith('.preload.json')
    if (isPreloadRequest) {
      req.url = req.url.replace(/(\/index)?\.preload\.json/, '')
      if (req.url[0] !== '/') {
        req.url = `/${req.url}`
      }
    }
    await render(req, res, next, {
      ssrManifest,
      serverEntry,
      isPreloadRequest,
      dotReamDir,
    })
  })

  server.onError(async (err, req, res, next) => {
    if (ctx.ssrFixStacktrace) {
      ctx.ssrFixStacktrace(err)
    }
    console.error('server error', err.stack)

    try {
      const response = (err as FetchError).response as Response | undefined
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
