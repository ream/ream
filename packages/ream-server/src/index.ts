import { join } from 'path'
import express, {
  Express,
  RequestHandler,
  Request,
  Response,
  NextFunction,
} from 'express'
import { findMatchedRoute } from '@ream/common/dist/find-matched-route'
import { prodReadRoutes } from '@ream/common/dist/prod-read-routes'
import { Route } from '@ream/common/dist/route'
import { renderToHTML, PageInterface, getPageProps } from './utils'

function render404(res: Response) {
  return res.status(404).end('404')
}

export function createPagePropsHandler(
  routes: Route[],
  buildDir: string,
  serveStaticProps?: boolean
): RequestHandler {
  return async (req, res) => {
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
      req,
      res,
      pageEntryName: route.entryName,
      serveStaticProps,
    })

    res.send(pageProps)
  }
}

export type CreateServerOptions = {
  serveStaticProps?: boolean
  beforeMiddlewares?: (server: Express) => void
  routes?: Route[]
}

/**
 * @param dir Absolute path to your project root
 */
export function createServer(dir: string, options: CreateServerOptions = {}) {
  const server = express()
  const buildDir = join(dir, '.ream')

  const { serveStaticProps, beforeMiddlewares } = options

  if (beforeMiddlewares) {
    beforeMiddlewares(server)
  }

  server.use('/_ream', express.static(join(buildDir, 'client')))

  const routes = options.routes || prodReadRoutes(buildDir)
  const clientManifest = require(join(
    buildDir,
    'client/vue-ssr-client-manifest.json'
  ))
  const _app = require(join(buildDir, `server/pages/_app`))
  const _document = require(join(buildDir, `server/pages/_document`))

  server.get('*.pageprops.json', createPagePropsHandler(routes, buildDir, serveStaticProps))

  server.get('*', async (req, res, next) => {
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
    const html = await renderToHTML(page, {
      route,
      clientManifest,
      _app,
      _document,
      buildDir,
      serveStaticProps,
      req,
      res,
    })

    res.end(`<!DOCTYPE html>${html}`)
  })

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