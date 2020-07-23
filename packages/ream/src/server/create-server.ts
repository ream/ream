import { renderToString } from '@vue/server-renderer'
import serializeJavaScript from 'serialize-javascript'
import { Head } from '@ream/head'
import { Ream } from '../'
import { Server } from './server'
import { findMatchedRoute } from '../utils/route-helpers'

export async function getRequestHandler(api: Ream) {
  const server = new Server()

  if (api.isDev) {
    const { createDevMiddlewares } = await import('./dev-middlewares')
    const devMiddlewares = createDevMiddlewares(api)
    for (const m of devMiddlewares) {
      server.use(m)
    }
  }

  server.use(async (req, res, next) => {
    if (req.method !== 'GET') {
      return res.end('unsupported method')
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
      const handler = await routes[route.entryName]()
      await handler.default(req, res, next)
      return
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
      <script src="/_ream/js/main.js"></script>`,
      htmlAttrs: noop,
      headAttrs: noop,
      bodyAttrs: noop,
    })

    res.setHeader('content-type', 'text/html')
    res.end(`<!DOCTYPE html>${html}`)
  })

  return server.handler
}
