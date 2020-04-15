import { join } from 'path'
import express, {
  Express,
  RequestHandler,
  Request,
  Response,
  NextFunction,
} from 'express'
import { findMatchedRoute } from '@ream/common/dist/route-helpers'
import { prodReadRoutes } from '@ream/common/dist/prod-read-routes'
import { Route } from '@ream/common/dist/route'
import {
  renderToHTML,
  PageInterface,
  getPageProps,
  getServerAssets,
} from './utils'

export function createPagePropsHandler(
  getRoutes: () => Route[],
): RequestHandler {
  return async (req, res) => {
    const routes = getRoutes()

    req.url = req.url
      .replace('.pageprops.json', '')
      .replace(/\/index$/, '')
      .replace(/^$/, '/')

    const { route, params } = findMatchedRoute(routes, req.path)
    if (!route) {
      return res.status(404).end('404')
    }
    req.params = params

    const page = __non_webpack_require__(join(__REAM_BUILD_DIR__, `server/${route.entryName}`))

    const pageProps = await getPageProps(page, {
      pageEntryName: route.entryName,
      getServerSidePropsContext: {
        req,
        res,
        params,
        query: req.query,
        path: req.path,
      },
      getStaticPropsContext: {
        params,
      },
    })

    res.send(pageProps)
  }
}

export type CreateServerOptions = {
  beforeMiddlewares?: (server: Express) => void
  getRoutes?: () => Route[]
}

/**
 * @param dir Absolute path to your project root
 */
export function createServer(options: CreateServerOptions = {}) {
  const server = express()

  const { beforeMiddlewares } = options

  if (beforeMiddlewares) {
    beforeMiddlewares(server)
  }

  if (!__DEV__) {
    server.use('/_ream', express.static(join(__REAM_BUILD_DIR__, 'client')))
  }

  const getRoutes = options.getRoutes || (() => __non_webpack_require__(join(__REAM_BUILD_DIR__, 'routes.json')))

  server.get(
    '*.pageprops.json',
    createPagePropsHandler(getRoutes)
  )

  server.get('*', async (req, res, next) => {
    const routes = getRoutes()
    let { route, params } = findMatchedRoute(routes, req.path)
    req.params = params

    if (!route) {
      route = {
        routePath: req.path,
        entryName: 'pages/404',
        absolutePath: 'nope',
        relativePath: 'nope',
        isClientRoute: true,
        isApiRoute: false,
        score: 0,
        index: 0
      }
      res.statusCode = 404
    }

    if (
      renderApiRoute(route, {
        req,
        res,
        next,
      })
    ) {
      return
    }

    res.setHeader('content-type', 'text/html')
    // @ts-ignore TODO
    req.__route_path__ = route.routePath
    const page: PageInterface = __non_webpack_require__(join(
      __REAM_BUILD_DIR__,
      `server/${route.entryName}`
    ))
    const { clientManifest, _app, _document } = getServerAssets()
    try {
      const html = await renderToHTML(page, {
        pageEntryName: route.entryName,
        clientManifest,
        _app,
        _document,
        path: req.path,
        url: req.url,
        originalPath: route.routePath,
        getServerSidePropsContext: {
          req,
          res,
          params,
          query: req.query,
          path: req.path,
        },
        getStaticPropsContext: {
          params,
        },
        initialPageProps: route.entryName === 'pages/404' ? {
          __404__: true
        } : {}
      })
      res.end(`<!DOCTYPE html>${html}`)
    } catch (err) {
      next(err)
    }
  })

  server.use(
    async (err: Error, req: Request, res: Response, next: NextFunction) => {
      if (__DEV__) {
        console.error(err)
      }
      res.statusCode =
        !req.statusCode || req.statusCode < 400 ? 500 : req.statusCode
      const { _error, _app, _document, clientManifest } = getServerAssets(
      )
      const html = await renderToHTML(_error, {
        pageEntryName: `pages/_error`,
        _app,
        _document,
        clientManifest,
        path: req.path,
        url: req.url,
        // @ts-ignore
        originalPath: req.__route_path__ || req.url,
        getServerSidePropsContext: {
          req,
          res,
          params: req.params,
          query: req.query,
          path: req.path,
        },
        getStaticPropsContext: {
          params: req.params,
        },
        initialPageProps: {
          __ream_error__: true,
          error: {
            statusCode: res.statusCode,
            stack: __DEV__ ? err.stack : '',
          },
        },
      })
      res.send(`<!DOCTYPE html>${html}`)
    }
  )

  return server
}

export function renderApiRoute(
  route: Route,
  { req, res, next }: { req: Request; res: Response; next: NextFunction }
) {
  if (route.isApiRoute) {
    const page = __non_webpack_require__(join(__REAM_BUILD_DIR__, `server/${route.entryName}.js`))
    page.default(req, res, next)
    return true
  }
}

export * from './utils'
