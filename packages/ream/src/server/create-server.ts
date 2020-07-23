import { renderToString } from '@vue/server-renderer'
import serializeJavaScript from 'serialize-javascript'
import serveStatic from 'serve-static'
import { Head } from '@ream/head'
import { Ream } from '../'
import { Server } from './server'
import { findMatchedRoute } from '../utils/route-helpers'
import { ClientManifest } from '../webpack/plugins/client-manifest'

export async function getRequestHandler(api: Ream) {
  const server = new Server()

  let clientManifest: ClientManifest | undefined

  if (api.isDev) {
    const { createDevMiddlewares } = await import('./dev-middlewares')
    const devMiddlewares = createDevMiddlewares(api, (_clientManifest) => {
      clientManifest = _clientManifest
    })
    for (const m of devMiddlewares) {
      server.use(m)
    }
  } else {
    clientManifest = require(api.resolveDotReam('client/client-manifest.json'))

    const staticHandler = serveStatic(api.resolveDotReam('client'))
    server.use((req, res, next) => {
      if (req.url.startsWith('/_ream/')) {
        req.url = req.url.replace(/^\/_ream/, '')
        return staticHandler(req as any, res as any, next)
      }
      next()
    })
  }

  server.use(async (req, res, next) => {
    if (!clientManifest) {
      return res.end(`Please wait for build to complete..`)
    }

    const context: { url: string; pagePropsStore: any } = {
      url: req.url,
      pagePropsStore: {},
    }
    const { default: createApp, routes } = require(api.resolveDotReam(
      'server/main.js'
    ))

    const { params, route } = findMatchedRoute(api.routes, req.path)

    if (!route) {
      return res.end('404')
    }

    if (route.isApiRoute) {
      if (api.exportedApiRoutes) {
        if (Object.keys(req.query).length > 0) {
          throw new Error(
            `You can't request API routes with query string in exporting mode`
          )
        }
      }
      const handler = await routes[route.entryName]()
      await handler.default(req, res, next)
      if (api.exportedApiRoutes) {
        // Keep this path when request succeeds
        api.exportedApiRoutes.add(req.path)
      }
      return
    }

    if (req.method !== 'GET') {
      return res.end('unsupported method')
    }

    const routeComponent = await routes[route.entryName]()
    const preloadContext = { params }
    const preloadResult =
      routeComponent.preload && (await routeComponent.preload(preloadContext))
    context.pagePropsStore = {
      [req.path]: preloadResult?.props || {},
    }

    const app = await createApp(context)
    const appHTML = await renderToString(app)
    const head: Head = app.config.globalProperties.$head
    const { default: getDocument } = await routes['pages/_document']()
    const noop = () => ''
    const html = await getDocument({
      head: () => `${head.title.toString()}`,
      main: () => `<div id="_ream">${appHTML}</div>`,
      script: () => `
      <script>INITIAL_STATE=${serializeJavaScript(
        {
          pagePropsStore: context.pagePropsStore,
        },
        { isJSON: true }
      )}</script>
      ${clientManifest!.initial
        .map(
          (file) =>
            `<script src="${clientManifest!.publicPath + file}"></script>`
        )
        .join('')}`,
      htmlAttrs: noop,
      headAttrs: noop,
      bodyAttrs: noop,
    })

    res.setHeader('content-type', 'text/html')
    res.end(`<!DOCTYPE html>${html}`)
  })

  return server.handler
}
