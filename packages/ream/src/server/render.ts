import { Component } from 'vue'
import { renderToString } from '@vue/server-renderer'
import serializeJavaScript from 'serialize-javascript'
import { HeadProvider } from 'ream/head'
import { findMatchedRoute } from '../utils/route-helpers'
import { h, Fragment } from 'vue'
import { Ream } from '../node'
import { ClientManifest } from '../webpack/plugins/client-manifest'
import {
  ReamServerRequest,
  ReamServerResponse,
  ReamServerHandler,
} from './server'
import { NextFunction } from 'connect'
import { Preload, ServerPreload, StaticPreload, StaticPaths } from '..'
import { readFile, pathExists, outputFile } from 'fs-extra'
import serializeJavascript from 'serialize-javascript'
import { getOutputHTMLPath, getOutputServerPreloadPath } from '../utils/paths'
import { join } from 'path'

export type RenderError = {
  statusCode: number
}

export type ClientRouteLoader = {
  type: 'client'
  load: () => Promise<{
    default: Component
    preload?: Preload
    serverPreload?: ServerPreload
    staticPreload?: StaticPreload
    staticPaths?: StaticPaths
  }>
}

export type ServerRouteLoader = {
  type: 'server'
  load: () => Promise<{ default: ReamServerHandler }>
}

export const getServerMain = (
  api: Ream
): {
  createApp: any
  routes: {
    [entryName: string]: ClientRouteLoader | ServerRouteLoader
  }
} => {
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
  return routes['routes/_error'] as ClientRouteLoader
}

export async function render(
  api: Ream,
  req: ReamServerRequest,
  res: ReamServerResponse,
  next: NextFunction,
  {
    clientManifest,
    isServerPreload,
  }: { clientManifest?: ClientManifest; isServerPreload?: boolean }
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
    if (api.exportedServerRoutes) {
      if (Object.keys(req.query).length > 0) {
        throw new Error(
          `You can't request API routes with query string in exporting mode`
        )
      }
    }
    const routeLoader = routes[route.entryName]
    if (routeLoader.type === 'server') {
      const handler = await routeLoader.load()
      await handler.default(req, res, next)
      if (api.exportedServerRoutes) {
        // Keep this path when request succeeds
        api.exportedServerRoutes.add(req.path)
      }
      return
    }
  }

  if (req.method !== 'GET') {
    return res.end('unsupported method')
  }
  const routeLoader = routes[route.entryName] as ClientRouteLoader
  const routeComponent = await routeLoader.load()
  const exportDir = api.resolveDotReam('export')
  const staticHTMLPath = join(exportDir, getOutputHTMLPath(req.path))
  const staticPreloadOutputPath = join(
    exportDir,
    getOutputServerPreloadPath(req.path)
  )
  const shouldExport =
    !routeComponent.preload && !routeComponent.serverPreload && !api.isDev
  const hasStaticHTML = shouldExport && (await pathExists(staticHTMLPath))
  if (isServerPreload) {
    res.setHeader('content-type', 'application/json')
    if (hasStaticHTML) {
      res.end(await readFile(staticPreloadOutputPath, 'utf8'))
    } else {
      const { props } = await getPreloadData(routeComponent, {
        req,
        res,
        params: req.params,
      })
      const result = serializeJavascript(props, { isJSON: true })
      res.end(result)
      if (shouldExport) {
        outputFile(staticPreloadOutputPath, result, 'utf8').catch(console.error)
      }
    }
  } else {
    res.setHeader('content-type', 'text/html')
    if (hasStaticHTML) {
      const html = await readFile(staticHTMLPath, 'utf8')
      res.end(html)
    } else {
      const { props } = await getPreloadData(routeComponent, {
        req,
        res,
        params: req.params,
      })
      const html = await renderToHTML(api, {
        params: req.params,
        url: req.url,
        path: req.path,
        req,
        res,
        props,
        clientManifest,
      })
      const result = `<!DOCTYPE>${html}`
      res.end(result)
      if (shouldExport) {
        outputFile(staticHTMLPath, result, 'utf8').catch(console.error)
      }
    }
  }
}

export async function renderToHTML(
  api: Ream,
  options: {
    params: any
    url: string
    path: string
    req?: any
    res?: any
    props: {
      [k: string]: any
    }
    clientManifest: ClientManifest
  }
) {
  const context: { url: string; pagePropsStore: any } = {
    url: options.url,
    pagePropsStore: {},
  }
  context.pagePropsStore = {
    [options.path]: options.props,
  }

  const { createApp, routes } = getServerMain(api)
  const app = await createApp(context)
  const appHTML = await renderToString(app)
  const head: HeadProvider = app.config.globalProperties.$head
  const headHTML = await renderToString(h(Fragment, head.headTags))
  const routeLoader = routes['routes/_document'] as any
  const { default: getDocument } = await routeLoader.load()
  const noop = () => ''
  const addPublicPath = (file: string) =>
    options.clientManifest.publicPath + file
  const scripts =
    options.clientManifest.initial
      .filter((file) => file.endsWith('.js'))
      .map(addPublicPath) || []
  const styles =
    options.clientManifest.initial
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

  return `<!DOCTYPE html>${html}`
}

export async function getPreloadData(
  component: any,
  options: { req?: ReamServerRequest; res?: ReamServerResponse; params: any }
) {
  const [
    preloadResult,
    serverPreloadResult,
    staticPreloadResult,
  ] = await Promise.all([
    component.preload &&
      (await component.preload({
        req: options.req,
        res: options.res,
        params: options.params,
      })),
    component.serverPreload &&
      component.serverPreload({
        req: options.req,
        res: options.res,
        params: options.params,
      }),
    component.staticPreload &&
      component.staticPreload({
        params: options.params,
      }),
  ])
  return {
    props: {
      ...preloadResult,
      ...serverPreloadResult,
      ...staticPreloadResult,
    },
  }
}
