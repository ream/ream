import serveStatic from 'serve-static'
import { FetchError } from 'ream/fetch'
import { Ream } from '../node'
import { Server } from './server'
import { ClientManifest } from '../webpack/plugins/client-manifest'
import {
  render,
  renderToHTML,
  getErrorComponent,
  getPreloadData,
} from './render'

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
    if (req.path.endsWith('.serverpreload.json')) {
      req.url = req.url.replace(/(\/index)?\.serverpreload\.json/, '')
      if (req.url[0] !== '/') {
        req.url = `/${req.url}`
      }
      await render(api, req, res, next, {
        clientManifest,
        isServerPreload: true,
      })
    } else {
      await render(api, req, res, next, { clientManifest })
    }
  })

  server.onError(async (err, req, res, next) => {
    console.error('server error', err)
    const response = (err as FetchError).response as Response | undefined
    if (response) {
      res.statusCode = response.status
    } else {
      res.statusCode =
        !res.statusCode || res.statusCode < 400 ? 500 : res.statusCode
    }
    const component = getErrorComponent(api)
    const { props } = await getPreloadData(component, {
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
      props: {
        ...props,
        error: {
          statusCode: res.statusCode,
          stack: api.isDev ? err.stack : undefined,
        },
      },
      clientManifest: clientManifest!,
    })
    res.setHeader('content-type', 'text-html')
    res.end(html)
  })

  return server.handler
}
