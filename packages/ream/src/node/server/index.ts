import path from 'path'
import fs from 'fs'
import type { Router, RouteRecordRaw } from 'vue-router'
import type { HTMLResult as HeadResult } from '@vueuse/head'
import serveStatic from 'sirv'
import type { LoadOptions } from './load'
import {
  ReamServerRequest,
  ReamServerResponse,
  createServer as createHttpServer,
  ReamServer,
} from './server'
import { render, renderToHTML, loadPageData } from './render'
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

export * from './load'

export { Connect } from './connect'

export type ServerEntry = {
  render: any
  createClientRouter: () => Router
  createServerRouter: () => Router
  renderHead: (app: any) => HeadResult
  ErrorComponent: any
  serverRoutes: RouteRecordRaw[]
  clientRoutes: RouteRecordRaw[]
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
  before?: (server: ReamServer) => void
  fixStacktrace?: (err: Error) => void
  serverEntry: ServerEntry
  exportManifest?: any
  ssrManifest?: any
  clientManifest?: any
  htmlTemplate: string
}

export { render, renderToHTML, loadPageData, ExportCache, getExportOutputPath }

export const createClientRouter = async (
  serverEntry: ServerEntry,
  url: string
) => {
  const router = serverEntry.createClientRouter()

  await serverEntry.enhanceApp.callAsync('onCreatedRouter', { router })

  await router.push(url)
  await router.isReady()

  return router
}

export const getLoadOptions = (req: ReamServerRequest): LoadOptions => {
  return {
    get path() {
      return req.path
    },
    get params() {
      return req.params
    },
    get host() {
      return req.headers.host as string
    },
    get query() {
      return req.query
    },
    get headers() {
      return req.headers
    },
  }
}

export async function createHandler(options: CreateServerOptions) {
  const dotReamDir = path.resolve(options.cwd || '.', '.ream')

  const serverEntry = options.serverEntry
  const ssrManifest = options.ssrManifest || {}
  const clientManifest = options.clientManifest || {}
  const htmlTemplate = options.htmlTemplate
  const exportCache: ExportCache | undefined =
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

    res.statusCode =
      !res.statusCode || res.statusCode < 400 ? 500 : res.statusCode

    const error = {
      status: res.statusCode,
      message: options.dev ? err.stack : undefined,
    }

    if (req.isLoadRequest) {
      return res.send({ error })
    }

    try {
      const router = await createClientRouter(serverEntry, req.url)
      const ErrorComponent = await serverEntry.ErrorComponent.__asyncLoader()
      const loadResult = await loadPageData(
        undefined,
        [ErrorComponent],
        getLoadOptions(req)
      )
      loadResult.error = error
      const html = await renderToHTML({
        path: req.path,
        url: req.url,
        router,
        loadResult,
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

  if (options.before) {
    options.before(server)
  }

  const renderNotFound = async (
    req: ReamServerRequest,
    res: ReamServerResponse,
    router: Router
  ) => {
    res.statusCode = 404

    if (req.isLoadRequest) {
      return res.send({ status: 404 })
    }

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
        loadOptions: getLoadOptions(req),
        isLoadRequest: false,
        ssrManifest,
        serverEntry,
        clientManifest,
        router,
        notFound: true,
        htmlTemplate,
      })
      html = result.html
    }
    res.send(html!)
  }

  // Server static assets in production mode
  const clientDir = path.join(dotReamDir, 'client')
  // In some cases `client` dir might not exist in a production
  // e.g. when deployed on Vercel, the `client` folder is served by Vercel instead
  if (!options.dev && fs.existsSync(clientDir)) {
    const serveStaticFiles = serveStatic(clientDir)
    server.use((req, res, next) => {
      if (req.path === '/' || req.path === '/index.html') return next()
      return serveStaticFiles(req, res, next)
    })
  }

  await serverEntry.enhanceServer.callAsync('extendServer', {
    server,
  })

  server.use(async function handleServerRoutes(req, res, next) {
    const serverRouter = serverEntry.createServerRouter()
    await serverRouter.push(req.url)
    await serverRouter.isReady()
    const { matched } = serverRouter.currentRoute.value
    const route = matched[0]
    if (route.name === '404') {
      return next()
    }
    const mod = await route.meta.load()
    return mod.default(req, res, next)
  })

  server.use(async function handleAppRoute(req, res, next) {
    if (req.method !== 'GET') {
      return next()
    }

    if (req.isLoadRequest) {
      req.url = req.url.replace(/(\/index)?\.load\.json/, '')
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
      if (req.isLoadRequest) {
        res.send(serializeJavascript(pageCache.loadResult, { isJSON: true }))
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
    const { html, loadResult } = await render({
      url: req.url,
      loadOptions: getLoadOptions(req),
      isLoadRequest: req.isLoadRequest,
      ssrManifest,
      serverEntry,
      clientManifest,
      htmlTemplate,
      router,
    })

    if (loadResult.error) {
      res.statusCode = loadResult.error.status
    }

    if (!pageCache || !pageCache.isStale) {
      if (req.isLoadRequest) {
        res.send(serializeJavascript(loadResult, { isJSON: true }))
      } else {
        if (loadResult.redirect) {
          res.writeHead(loadResult.redirect.permanent ? 301 : 302, {
            Location: loadResult.redirect.url,
          })
          res.end()
        } else {
          res.send(html || '')
        }
      }
    }

    if (exportCache && !loadResult.hasLoad && !options.dev) {
      await exportCache.set(req.path, {
        html: html,
        loadResult,
      })
    }
  })

  return server.handler
}
