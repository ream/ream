import { resolve, join } from 'path'
import express, {
  RequestHandler,
  Request,
  Response,
  NextFunction,
} from 'express'
import { useProdMiddlewares } from './use-prod-middlewares'
import { findMatchedRoute } from '@ream/common/dist/find-matched-route'
import { prodReadRoutes } from '@ream/common/dist/prod-read-routes'
import {Route} from '@ream/common/dist/route'

export function createPagePropsHandler(
  routes: Route[],
  buildDir: string
): RequestHandler {
  return async (req, res) => {
    req.url = req.url
      .replace('.pageprops.json', '')
      .replace(/\/index$/, '')
      .replace(/^$/, '/')

    const { route, params } = findMatchedRoute(routes, req.path)
    if (!route) {
      return res.status(404).end('404')
    }

    req.params = params
    const { renderServerProps } = require(join(
      buildDir,
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
  }
}

/**
 * @param dir Absolute path to your project root
 */
export function createServer(dir: string) {
  const server = express()
  const buildDir = join(dir, '.ream')

  useProdMiddlewares(server, buildDir)

  const routes = prodReadRoutes(buildDir)

  server.get('*.pageprops.json', createPagePropsHandler(routes, buildDir))

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

export type ServerContent = {
  req: Request
  res: Response
  params: {
    [k: string]: any
  }
}

export async function renderToHTML(
  serverContext: ServerContent,
  buildDir: string,
  route: Route
) {
  const serverRenderer = require(join(buildDir, 'server/server-renderer.js'))
  const clientManifest = require(join(
    buildDir,
    'client/vue-ssr-client-manifest.json'
  ))
  return serverRenderer.render(
    {
      _app: require(join(buildDir, 'server/pages/_app')),
      _document: require(join(buildDir, 'server/pages/_document')),
      entryPage: route.entryName,
      path: serverContext.req.path,
      clientManifest,
    },
    serverContext
  )
}

export function renderApiRoute(
  route: Route,
  buildDir: string,
  { req, res, next }: { req: Request; res: Response; next: NextFunction }
) {
  if (route.isApiRoute) {
    const page = require(join(buildDir, `server/${route.entryName}.js`))
    page.default(req, res, next)
    return true
  }
}
