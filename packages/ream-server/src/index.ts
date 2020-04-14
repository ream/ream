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

function render404(res: Response) {
  return res.status(404).end('404')
}

export function createPagePropsHandler(
  getRoutes: () => Route[],
  buildDir: string,
  dev?: boolean
): RequestHandler {
  return async (req, res) => {
    const routes = getRoutes()

    req.url = req.url
      .replace('.pageprops.json', '')
      .replace(/\/index$/, '')
      .replace(/^$/, '/')

    const { route, params } = findMatchedRoute(routes, req.path)
    if (!route) {
      return render404(res)
    }
    req.params = params

    const page = require(join(buildDir, `server/${route.entryName}`))

    const pageProps = await getPageProps(page, {
      buildDir,
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
      dev,
    })

    res.send(pageProps)
  }
}

export type CreateServerOptions = {
  /**
   * Disable production middlewares and optimizations
   */
  dev?: boolean
  beforeMiddlewares?: (server: Express) => void
  getRoutes?: () => Route[]
}

/**
 * @param dir Absolute path to your project root
 */
export function createServer(dir: string, options: CreateServerOptions = {}) {
  const server = express()
  const buildDir = join(dir, '.ream')

  const { dev, beforeMiddlewares } = options

  if (beforeMiddlewares) {
    beforeMiddlewares(server)
  }

  if (!dev) {
    server.use('/_ream', express.static(join(buildDir, 'client')))
  }

  const getRoutes = options.getRoutes || (() => prodReadRoutes(buildDir))

  server.get(
    '*.pageprops.json',
    createPagePropsHandler(getRoutes, buildDir, dev)
  )

  server.get('*', async (req, res, next) => {
    const routes = getRoutes()
    const { route, params } = findMatchedRoute(routes, req.path)
    req.params = params

    if (!route) {
      return render404(res)
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

    const page: PageInterface = require(join(
      buildDir,
      `server/${route.entryName}`
    ))
    const { clientManifest, _app, _document } = getServerAssets(buildDir)
    try {
      const html = await renderToHTML(page, {
        pageEntryName: route.entryName,
        clientManifest,
        _app,
        _document,
        buildDir,
        dev,
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
      res.end(`<!DOCTYPE html>${html}`)
    } catch (err) {
      next(err)
    }
  })

  server.use(
    async (err: Error, req: Request, res: Response, next: NextFunction) => {
      if (dev) {
        console.error(err)
      }
      res.statusCode =
        !req.statusCode || req.statusCode < 400 ? 500 : req.statusCode
      const { _error, _app, _document, clientManifest } = getServerAssets(
        buildDir
      )
      const html = await renderToHTML(_error, {
        pageEntryName: `pages/_error`,
        _app,
        _document,
        clientManifest,
        buildDir,
        path: req.path,
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
            stack: dev ? err.stack : '',
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
  buildDir: string,
  { req, res, next }: { req: Request; res: Response; next: NextFunction }
) {
  if (route.isApiRoute) {
    const page = require(join(buildDir, `server/${route.entryName}.js`))
    page.default(req, res, next)
    return true
  }
}

export * from './utils'
