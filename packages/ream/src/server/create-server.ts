import express from 'express'
import { Ream } from '../'
import { pathToRegexp, Key } from 'path-to-regexp'
import * as UseDevMiddleware from './use-dev-middlewares'
import * as UseProdMiddleware from './use-prod-middlewares'

export function createServer(api: Ream) {
  const server = express()

  if (api.isDev) {
    const {
      useDevMiddlewares,
    } = require('./use-dev-middlewares') as typeof UseDevMiddleware

    useDevMiddlewares(api, server)
  } else {
    const {
      useProdMiddlewares,
    } = require('./use-prod-middlewares') as typeof UseProdMiddleware
    useProdMiddlewares(api, server)
  }

  const clearRequireCache = () => {
    if (api.isDev && require.cache) {
      for (const key of Object.keys(require.cache)) {
        if (key.startsWith(api.resolveDotReam())) {
          delete require.cache[key]
        }
      }
    }
  }

  function exec(path: string, regexp: RegExp, keys: Key[]) {
    let i = 0
    const out: { [k: string]: string } = {}
    const matches = regexp.exec(path)
    if (matches) {
      while (i < keys.length) {
        const name = keys[i].name
        const value = matches[++i]
        if (value !== undefined) {
          out[name] = value
        }
      }
    }
    return out
  }

  const findMatchedRoute = async (path: string) => {
    for (const route of api.routes) {
      if (route.isClientRoute || route.isApiRoute) {
        const keys: Key[] = []
        const regexp = pathToRegexp(route.routePath, keys)
        if (regexp.test(path)) {
          const params = exec(path, regexp, keys)
          return {
            params,
            route,
          }
        }
      }
    }
    return { params: {} }
  }

  server.get('*.pageprops.json', async (req, res) => {
    clearRequireCache()

    req.url = req.url
      .replace('.pageprops.json', '')
      .replace(/\/index$/, '')
      .replace(/^$/, '/')

    const { route, params } = await findMatchedRoute(req.path)
    if (!route) {
      return res.status(404).end('404')
    }

    req.params = params
    const { renderServerProps } = require(api.resolveDotReam(
      'server/server-renderer.js'
    ))

    const result = await renderServerProps(
      { entryPage: route.entryName },
      {
        req,
        res,
        params,
      }
    )
    res.send(result)
  })

  server.get('*', async (req, res, next) => {
    clearRequireCache()

    const { route, params } = await findMatchedRoute(req.path)
    req.params = params

    if (!route) {
      return res.status(404).end('404')
    }

    if (route.isApiRoute) {
      const page = require(api.resolveDotReam(`server/${route.entryName}.js`))
      page.default(req, res, next)
      return
    }
    
    res.setHeader('content-type', 'text/html')

    const serverRenderer =require(api.resolveDotReam('server/server-renderer.js'))

    const clientManifest = require(api.resolveDotReam(
      'client/vue-ssr-client-manifest.json'
    ))
    const html = await serverRenderer.render(
      {
        _app: require(api._appOutputPathForServer),
        _document: require(api._documentOutputPathForServer),
        entryPage: route.entryName,
        path: req.path,
        clientManifest,
      },
      {
        req,
        res,
        params,
      }
    )

    res.end(`<!DOCTYPE html>${html}`)
  })

  return server
}
