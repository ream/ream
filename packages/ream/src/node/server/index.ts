import path from 'path'
import type { Router, RouteRecordRaw } from 'vue-router'
import type { HTMLResult as HeadResult } from '@vueuse/head'
import serveStatic from 'sirv'
import type { Preload } from './preload'
import {
  ReamServerRequest,
  ReamServerResponse,
  createServer as createHttpServer,
} from './server'
import { render, renderToHTML, getPreloadData } from './render'
import { ExportCache, getExportOutputPath } from './export-cache'
import serializeJavascript from 'serialize-javascript'
import { OnError } from './connect'
import { GetInitialHTML } from './hooks'
export type {
  ReamServerHandler,
  ReamServerRequest,
  ReamServerResponse,
} from './server'

// Re-export hook types
export * from './hooks'

export * from './preload'

export { Connect } from './connect'

export type ServerEntry = {
  render: any
  createClientRouter: () => Router
  createServerRouter: () => Router
  renderHead: (app: any) => HeadResult
  ErrorComponent: any
  serverRoutes: RouteRecordRaw[]
  clientRoutes: RouteRecordRaw[]
  getGlobalPreload: () => Promise<Preload | undefined>
  enhanceApp: {
    callAsync: (name: string, context: any) => Promise<void>
  }
  enhanceServer: {
    hasExport: (name: string) => boolean
    getInitialHTML: GetInitialHTML
    callAsync: (name: string, context: any) => Promise<void>
  }
}

export type ExportManifest = {
  staticPages: { path: string; fallback?: boolean }[]
}

export type ServerContext = {
  serverEntry: ServerEntry
  getExportManifest?: () => ExportManifest
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
  fixStacktrace?: (err: Error) => void
  serverEntry: ServerEntry
  exportManifest?: any
  ssrManifest?: any
  clientManifest?: any
  htmlTemplate: string
}

export {
  render,
  renderToHTML,
  getPreloadData,
  ExportCache,
  getExportOutputPath,
}

export const createClientRouter = async (
  serverEntry: ServerEntry,
  url: string
) => {
  const router = serverEntry.createClientRouter()

  await serverEntry.enhanceApp.callAsync('onCreatedRouter', { router })

  router.push(url)
  await router.isReady()

  return router
}

export async function createHandler(options: CreateServerOptions) {
  const dotReamDir = path.resolve(options.cwd || '.', '.ream')

  const serverEntry = options.serverEntry
  const ssrManifest = options.ssrManifest || {}
  const clientManifest = options.clientManifest || {}
  const htmlTemplate = options.htmlTemplate
  const exportCache =
    options.exportManifest &&
    new ExportCache({
      exportDir: path.join(dotReamDir, 'export'),
      flushToDisk: true,
      exportManifest: options.exportManifest,
    })

  const onError: OnError<ReamServerRequest, ReamServerResponse> = async (
    err,
    req,
    res
  ) => {
    if (typeof err === 'string') {
      err = new Error(err)
    }

    if (options.fixStacktrace) {
      options.fixStacktrace(err)
    }
    console.error('server error', err.stack)

    try {
      res.statusCode =
        !res.statusCode || res.statusCode < 400 ? 500 : res.statusCode
      const router = await createClientRouter(serverEntry, req.url)
      const ErrorComponent = await serverEntry.ErrorComponent.__asyncLoader()
      const globalPreload = await serverEntry.getGlobalPreload()
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
        message: options.dev ? err.stack : undefined,
      }
      const html = await renderToHTML({
        params: req.params,
        path: req.path,
        url: req.url,
        req,
        res,
        router,
        preloadResult,
        serverEntry,
        ssrManifest,
        clientManifest,
        htmlTemplate,
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
  }

  const server = createHttpServer({
    onError,
  })

  const renderNotFound = async (
    req: ReamServerRequest,
    res: ReamServerResponse,
    router: Router
  ) => {
    let html: string | undefined
    if (exportCache) {
      const cache = await exportCache.get('/404.html')
      if (cache) {
        html = cache.html || ''
      }
    }
    if (!html) {
      const result = await render({
        url: req.url,
        req,
        res,
        isPreloadRequest: false,
        ssrManifest,
        serverEntry,
        clientManifest,
        router,
        notFound: true,
        htmlTemplate,
      })
      html = result.html
    }
    res.statusCode = 404
    res.send(html!)
  }

  if (options.devMiddleware) {
    server.use(options.devMiddleware)
  }

  // Server static assets in production mode
  if (!options.dev) {
    const serveStaticFiles = serveStatic(path.join(dotReamDir, 'client'))
    server.use(serveStaticFiles as any)
  }

  await serverEntry.enhanceServer.callAsync('extendServer', {
    server,
  })

  server.use(async function handleServerRoutes(req, res, next) {
    if (!req.path.startsWith('/api/')) {
      return next()
    }

    const serverRouter = serverEntry.createServerRouter()
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

  server.use(async function handleAppRoute(req, res, next) {
    if (req.method !== 'GET') {
      return next()
    }

    const isPreloadRequest = req.path.endsWith('.preload.json')
    if (isPreloadRequest) {
      req.url = req.url.replace(/(\/index)?\.preload\.json/, '')
      if (req.url[0] !== '/') {
        req.url = `/${req.url}`
      }
      const queryIndex = req.url.indexOf('?')
      if (queryIndex === -1) {
        req.path = req.url
      } else {
        req.path = req.url.substring(0, queryIndex)
      }
    }

    const router = await createClientRouter(serverEntry, req.url)
    const route = router.currentRoute.value
    req.params = route.params

    if (route.name === '404') {
      await renderNotFound(req, res, router)
      return
    }

    const rawPath = route.matched.map((m) => m.path).join('/')

    // Try loading the cache
    // Is this a static page? i.e. It doesn't use `preload`
    const staticPage = exportCache?.findStaticPage(rawPath)
    const pageCache = staticPage && (await exportCache?.get(req.path))

    if (pageCache) {
      if (isPreloadRequest) {
        res.send(serializeJavascript(pageCache.preloadResult, { isJSON: true }))
      } else if (pageCache.html) {
        res.send(pageCache.html)
      }

      // Break the request chain if the cache is not stale
      // No need to update the cache
      if (res.writableEnded && !pageCache.isStale) {
        return
      }
    }

    let fallback = true

    // Cache miss, static pages with `fallback` should still render on demand
    // Otherwise renders 404
    if (!pageCache && staticPage && !staticPage.fallback) {
      fallback = false
    }

    if (!fallback) {
      await renderNotFound(req, res, router)
      return
    }

    // Cache miss, dynamic page, do a fresh render
    const { html, preloadResult } = await render({
      url: req.url,
      req,
      res,
      isPreloadRequest,
      ssrManifest,
      serverEntry,
      clientManifest,
      htmlTemplate,
      router,
    })

    if (preloadResult.error) {
      res.statusCode = preloadResult.error.statusCode
    }

    if (!pageCache || !pageCache.isStale) {
      if (isPreloadRequest) {
        res.send(serializeJavascript(preloadResult, { isJSON: true }))
      } else {
        if (preloadResult.redirect) {
          res.writeHead(preloadResult.redirect.permanent ? 301 : 302, {
            Location: preloadResult.redirect.url,
          })
          res.end()
        } else {
          res.send(html || '')
        }
      }
    }

    if (exportCache && preloadResult.isStatic && !options.dev) {
      await exportCache.set(req.path, {
        html: html,
        preloadResult,
      })
    }
  })

  return server.handler
}
