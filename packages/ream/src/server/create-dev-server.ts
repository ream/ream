import express from 'express'
import { useDevMiddlewares } from './use-dev-middlewares'
import { findMatchedRoute } from '@ream/common/dist/find-matched-route'
import { Ream } from '..'
import {
  createPagePropsHandler,
  renderToHTML,
  renderApiRoute,
} from 'ream-server'

export function createDevServer(api: Ream) {
  const server = express()

  useDevMiddlewares(api, server)

  const clearRequireCache = () => {
    if (api.isDev && require.cache) {
      for (const key of Object.keys(require.cache)) {
        if (key.startsWith(api.resolveDotReam())) {
          delete require.cache[key]
        }
      }
    }
  }

  server.use((req, res, next) => {
    clearRequireCache()
    next()
  })

  const routes = api.routes
  const buildDir = api.resolveDotReam()
  const pagePropsHandler = createPagePropsHandler(routes, buildDir)
  server.get('*.pageprops.json', (req, res, next) => {
    return pagePropsHandler(req, res, next)
  })

  server.get('*', async (req, res, next) => {
    const { route, params } = findMatchedRoute(routes, req.path)
    req.params = params

    if (!route) {
      return res.status(404).end('404')
    }

    if (
      renderApiRoute(route, buildDir, {
        req,
        res,
        next,
      })
    ) {
      return
    }

    res.setHeader('content-type', 'text/html')

    const serverContext = {
      req,
      res,
      params,
    }
    const html = await renderToHTML(serverContext, buildDir, route)

    res.end(`<!DOCTYPE html>${html}`)
  })

  return server
}
