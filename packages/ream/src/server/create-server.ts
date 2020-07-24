import serveStatic from 'serve-static'
import { FetchError } from 'ream/fetch'
import { Ream } from '../node'
import { Server } from './server'
import { ClientManifest } from '../webpack/plugins/client-manifest'
import { render, renderPage, getErrorComponent } from './render'

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
    await render(api, req, res, next, { clientManifest })
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
    const Component = getErrorComponent(api)
    await renderPage(api, req, res, clientManifest!, Component, {
      error: {
        statusCode: res.statusCode,
        stack: api.isDev ? err.stack : undefined,
      },
    })
  })

  return server.handler
}
