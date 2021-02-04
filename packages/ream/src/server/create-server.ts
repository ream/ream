import serveStatic from 'serve-static'
import { FetchError } from 'ream/fetch'
import { Ream } from '../node'
import { Server } from './server'
import {
  render,
  renderToHTML,
  getErrorComponent,
  getPreloadData,
} from './render'

export async function getRequestHandler(api: Ream) {
  const server = new Server()

  let ssrManifest: any
  let serverEntry: any

  const loadServerEntry = async () => {
    if (api.viteDevServer) {
      serverEntry = await api.viteDevServer
        // @ts-ignore
        .ssrLoadModule(`@own-app-dir/server-entry.js`)
        .then((res: any) => res.default)
    } else {
      serverEntry = require(api.resolveDotReam(`server/server-entry.js`))
        .default
    }
  }

  if (api.isDev) {
    const { createDevMiddleware } = await import('./dev-middlewares')
    const middleware = await createDevMiddleware(api)
    server.use(middleware)
    ssrManifest = {}
  } else {
    ssrManifest = require(api.resolveDotReam('client/ssr-manifest.json'))
  }

  server.use(async (req, res, next) => {
    await loadServerEntry()
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
    await render(api, req, res, next, {
      ssrManifest,
      serverEntry,
      isPreloadRequest,
    })
  })

  server.onError(async (err, req, res, next) => {
    if (api.isDev && api.viteDevServer) {
      // @ts-ignore
      // api.viteDevServer.ssrFixStacktrace(err)
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
      const ErrorComponent = await getErrorComponent(api)
      const { props } = await getPreloadData([ErrorComponent], {
        req,
        res,
        params: req.params,
      })
      const html = await renderToHTML(api, {
        params: req.params,
        path: req.path,
        url: req.url,
        req,
        res,
        router,
        props: {
          ...props,
          error: {
            statusCode: res.statusCode,
            stack: api.isDev ? err.stack : undefined,
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
        api.isDev
          ? `<h1>Error occurs while rendering error page:</h1><pre>${error.stack}</pre>`
          : 'server error'
      )
    }
  })

  return server.handler
}
