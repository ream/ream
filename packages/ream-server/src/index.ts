import {join} from 'path'
import express, {
  Express,
  RequestHandler,
  Request,
  Response,
  NextFunction,
} from 'express'
import { findMatchedRoute } from '@ream/common/dist/route-helpers'
import { Route } from '@ream/common/dist/route'
import { createBundleRenderer } from '@ream/vue-server-renderer'
import { getPageProps, renderToHTML } from './utils'

export type BundleRenderer = ReturnType<typeof createBundleRenderer>

export type CreateServerOptions = {
  beforeMiddlewares?: (server: Express) => void
  getRoutes?: () => Route[]
}

export class ReamServer {
  options: CreateServerOptions
  renderer?: BundleRenderer

  constructor(options: CreateServerOptions = {}) {
    this.options = options
  }

  setRenderer(renderer: BundleRenderer) {
    this.renderer = renderer
  }

  getRoutes(): Route[] {
    if (this.options.getRoutes) {
      return this.options.getRoutes()
    }
    return __non_webpack_require__(`../routes-info.json`)
  }

  createRenderer() {
    this.renderer =
      this.renderer ||
      createBundleRenderer(
        __non_webpack_require__(
          `../ream-server-bundle.json`
        ),
        {
          basedir: __dirname,
          clientManifest: __non_webpack_require__(
            `../ream-client-manifest.json`
          ),
        }
      )

    return this.renderer
  }

  createServer() {
    const server = express()

    const { beforeMiddlewares } = this.options

    if (beforeMiddlewares) {
      beforeMiddlewares(server)
    }

    if (!__DEV__) {
      server.use('/_ream', express.static(join(__dirname, '../client')))
    }

    server.get('*.pageprops.json', this.createPagePropsHandler())

    server.get('*', async (req, res, next) => {
      const routes = this.getRoutes()
      let { route, params } = findMatchedRoute(routes, req.path)
      req.params = params

      const renderer = this.createRenderer()

      if (
        route &&
        route.isApiRoute
      ) {
        const { routes: allRoutes } = renderer.runner.evaluate('main.js')
        const page = await allRoutes[route.entryName]()
        page.default(req, res, next)
        return
      }

      res.setHeader('content-type', 'text/html')
      // @ts-ignore TODO
      req.__route_path__ = route.routePath

      if (route && route.is404) {
        res.statusCode = 404
      }

      const getServerSidePropsContext = {
        req,
        res,
        params,
        query: req.query,
        path: req.path,
      }

      const getStaticPropsContext = {
        params,
      }

      try {
        const context = {
          url: req.url,
          path: req.path,
          getServerSidePropsContext,
          getStaticPropsContext,
        }
        const html = await renderToHTML(renderer, context, route!.entryName)
        res.end(`<!DOCTYPE html>${html}`)
      } catch (err) {
        next(err)
      }
    })

    server.use(
      async (err: Error, req: Request, res: Response, next: NextFunction) => {
        const renderer = this.createRenderer()

        renderer.rewriteErrorTrace(err)

        if (__DEV__) {
          console.error('Server error', err)
        }
        res.statusCode =
          !req.statusCode || req.statusCode < 400 ? 500 : req.statusCode


        const html = await renderToHTML(renderer, {
          getServerSidePropsContext: {
            req,
            res,
            path: req.path,
            params: req.params,
            query: req.query
          },
          getStaticPropsContext: {
            params: req.params
          },
          path: req.path,
          url: req.url
        }, 'pages/_error', {
          __ream_error__: true,
          error: {
            statusCode: res.statusCode,
            stack: __DEV__ ? err.stack : ''
          }
        })

        res.send(`<!DOCTYPE html>${html}`)
      }
    )

    return server
  }

  createPagePropsHandler(): RequestHandler {
    return async (req, res) => {
      this.renderer = this.createRenderer()

      const routes = this.getRoutes()

      req.url = req.url
        .replace('.pageprops.json', '')
        .replace(/\/index$/, '')
        .replace(/^$/, '/')

      const { route, params } = findMatchedRoute(routes, req.path)
      if (!route) {
        return res.status(404).end('404')
      }
      req.params = params

      const { routes: allRoutes } = this.renderer.runner.evaluate(`main.js`)
      const page = await allRoutes[route.entryName]()

      const pageProps = await getPageProps(page, {
        path: req.path,
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
}

export * from './utils'