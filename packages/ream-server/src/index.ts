import {
  Server,
  ReamServerHandler,
  ReamServerResponse,
  ReamServerRequest,
} from './server'
import { findMatchedRoute } from '@ream/common/dist/route-helpers'
import { Route } from '@ream/common/dist/route'
import { createBundleRenderer } from '@ream/vue-server-renderer'
import sirv from 'sirv'
import { getPageProps, renderToHTML, getStaticHtml } from './utils'

export * from './utils'

export { ReamServerHandler, ReamServerResponse, ReamServerRequest }

export type BundleRenderer = ReturnType<typeof createBundleRenderer>

export type CreateServerOptions = {
  beforeMiddlewares?: (server: Server) => void
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
    return __non_webpack_require__(`../manifest/routes-info.json`)
  }

  createRenderer() {
    this.renderer =
      this.renderer ||
      createBundleRenderer(
        __non_webpack_require__(`../manifest/ream-server-bundle.json`),
        {
          basedir: __dirname,
          clientManifest: __non_webpack_require__(
            `../manifest/ream-client-manifest.json`
          ),
        }
      )

    return this.renderer
  }

  get staticHtmlRoutes(): { [path: string]: string } {
    if (__DEV__) {
      return {}
    }

    return __non_webpack_require__(
      `${__REAM_BUILD_DIR__}/manifest/static-html-routes.json`
    )
  }

  createServer() {
    const server = new Server()

    const { beforeMiddlewares } = this.options

    if (beforeMiddlewares) {
      beforeMiddlewares(server)
    }

    if (!__DEV__) {
      const serveWebpackAssets = sirv(`${__REAM_BUILD_DIR__}/client`, {
        maxAge: 86400 // 1 day
      })
      server.use('/_ream', (req, res, next) => {
        req.url = req.url.replace(/^\/_ream\//, '/')
        return serveWebpackAssets(req, res, next)
      })
    }

    const pagePropsHandler = this.createPagePropsHandler()
    server.use(pagePropsHandler)

    const staticHtmlRoutes = this.staticHtmlRoutes

    server.use(async (req, res, next) => {
      try {
        const sendHTML = (html: string) => {
          res.setHeader('content-type', 'text/html')
          res.end(html)
        }

        const routes = this.getRoutes()
        let { route, params } = findMatchedRoute(routes, req.path)
        req.params = params

        const renderer = this.createRenderer()

        if (route && route.isApiRoute) {
          const { routes: allRoutes } = renderer.runner.evaluate('main.js')
          const page = await allRoutes[route.entryName]()
          page.default(req, res, next)
          return
        }

        if (req.method !== 'GET') {
          return next()
        }

        if (staticHtmlRoutes[req.path]) {
          const html = await getStaticHtml(staticHtmlRoutes[req.path])
          return sendHTML(html)
        }

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

        const context = {
          url: req.url,
          path: req.path,
          getServerSidePropsContext,
          getStaticPropsContext,
        }
        const html = await renderToHTML(renderer, context, route!.entryName)
        sendHTML(`<!DOCTYPE html>${html}`)
      } catch (err) {
        next(err)
      }
    })

    server.onError(async (err, req, res) => {
      const renderer = this.createRenderer()

      renderer.rewriteErrorTrace(err)

      console.error('Server error', err)
      setErrorPageStatusCode(res)

      const html = await renderToHTML(
        renderer,
        {
          getServerSidePropsContext: {
            req,
            res,
            path: req.path,
            params: req.params,
            query: req.query,
          },
          getStaticPropsContext: {
            params: req.params,
          },
          path: req.path,
          url: req.url,
        },
        'pages/_error',
        getErrorPageProps(err, res)
      )

      res.send(`<!DOCTYPE html>${html}`)
    })

    return server
  }

  createPagePropsHandler(): ReamServerHandler {
    return async (req, res, next) => {
      if (!req.path.endsWith('.pageprops.json')) {
        return next()
      }

      this.renderer = this.createRenderer()

      const routes = this.getRoutes()

      req.url = req.url
        .replace('.pageprops.json', '')
        .replace(/\/index$/, '')
        .replace(/^$/, '/')

      const { route, params } = findMatchedRoute(routes, req.path)
      if (!route) {
        return next()
      }
      req.params = params

      try {
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
      } catch (err) {
        setErrorPageStatusCode(res)
        res.send(getErrorPageProps(err, res))
      }
    }
  }
}

function getErrorPageProps(err: Error, res: ReamServerResponse) {
  return {
    __ream_error__: true,
    error: {
      statusCode: res.statusCode,
      stack: __DEV__ ? err.stack : '',
    },
  }
}

function setErrorPageStatusCode(res: ReamServerResponse) {
  res.statusCode =
    !res.statusCode || res.statusCode < 400 ? 500 : res.statusCode
}
