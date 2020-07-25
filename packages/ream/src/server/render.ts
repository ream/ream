import { renderToString } from '@vue/server-renderer'
import serializeJavaScript from 'serialize-javascript'
import { HeadProvider } from 'ream/head'
import { findMatchedRoute } from '../utils/route-helpers'
import { h, Fragment } from 'vue'
import { Ream } from '../node'
import { ClientManifest } from '../webpack/plugins/client-manifest'
import { ReamServerRequest, ReamServerResponse } from './server'
import { NextFunction } from 'connect'

export type RenderError = {
  statusCode: number
}

export const getServerMain = (api: Ream): { createApp: any; routes: any } => {
  const { default: createApp, routes } = require(api.resolveDotReam(
    'server/main.js'
  ))
  return {
    createApp,
    routes,
  }
}

export const getErrorComponent = (api: Ream) => {
  const { routes } = getServerMain(api)
  return routes['routes/_error']
}

export async function render(
  api: Ream,
  req: ReamServerRequest,
  res: ReamServerResponse,
  next: NextFunction,
  {
    clientManifest,
    error,
  }: { clientManifest?: ClientManifest; error?: RenderError }
) {
  if (!clientManifest) {
    return res.end(`Please wait for build to complete..`)
  }

  const { routes } = getServerMain(api)

  const { params, route } = findMatchedRoute(api.routes, req.path)

  req.params = params

  if (!route) {
    // This actuall will never be reached
    // Since we have a catchAll page as 404 page
    throw new Error(`Page not found`)
  }

  if (route.is404) {
    res.statusCode = 404
  }

  if (route.isServerRoute) {
    if (api.exportedApiRoutes) {
      if (Object.keys(req.query).length > 0) {
        throw new Error(
          `You can't request API routes with query string in exporting mode`
        )
      }
    }
    const handler = await routes[route.entryName]()
    await handler.default(req, res, next)
    if (api.exportedApiRoutes) {
      // Keep this path when request succeeds
      api.exportedApiRoutes.add(req.path)
    }
    return
  }

  if (req.method !== 'GET') {
    return res.end('unsupported method')
  }
  const routeComponent = await routes[route.entryName]()
  await renderPage(api, req, res, clientManifest, routeComponent)
}

export async function renderPage(
  api: Ream,
  req: ReamServerRequest,
  res: ReamServerResponse,
  clientManifest: ClientManifest,
  component: any,
  props?: any
) {
  const getInitialPropsContext = { params: req.params }
  const getInitialPropsResult =
    component.getInitialProps &&
    (await component.getInitialProps(getInitialPropsContext))
  const context: { url: string; pagePropsStore: any } = {
    url: req.url,
    pagePropsStore: {},
  }
  context.pagePropsStore = {
    [req.path]: {
      ...getInitialPropsResult?.props,
      ...props,
    },
  }

  const { createApp, routes } = getServerMain(api)
  const app = await createApp(context)
  const appHTML = await renderToString(app)
  const head: HeadProvider = app.config.globalProperties.$head
  const headHTML = await renderToString(h(Fragment, head.headTags))
  const { default: getDocument } = await routes['routes/_document']()
  const noop = () => ''
  const addPublicPath = (file: string) => clientManifest.publicPath + file
  const scripts =
    clientManifest?.initial
      .filter((file) => file.endsWith('.js'))
      .map(addPublicPath) || []
  const styles =
    clientManifest?.initial
      .filter((file) => file.endsWith('.css'))
      .map(addPublicPath) || []
  const html = await getDocument({
    head: () =>
      `${headHTML}${styles.map(
        (file) => `<link rel="stylesheet" href="${file}">`
      )}`,
    main: () => `<div id="_ream">${appHTML}</div>`,
    script: () => `
      <script>INITIAL_STATE=${serializeJavaScript(
        {
          pagePropsStore: context.pagePropsStore,
        },
        { isJSON: true }
      )}</script>
      ${scripts.map((file) => `<script src="${file}"></script>`).join('')}`,
    htmlAttrs: noop,
    headAttrs: noop,
    bodyAttrs: noop,
  })

  res.setHeader('content-type', 'text/html')
  res.end(`<!DOCTYPE html>${html}`)
}
