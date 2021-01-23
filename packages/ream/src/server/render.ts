import { Component } from 'vue'
import { renderToString } from '@vue/server-renderer'
import serializeJavaScript from 'serialize-javascript'
import { findMatchedRoute } from '../utils/route-helpers'
import { Head, renderHeadToString } from '@vueuse/head'
import { Ream } from '../node'
import { ClientManifest } from '../webpack/plugins/client-manifest'
import {
  ReamServerRequest,
  ReamServerResponse,
  ReamServerHandler,
} from './server'
import { NextFunction } from 'connect'
import { readFile, pathExists, outputFile } from 'fs-extra'
import serializeJavascript from 'serialize-javascript'
import { getOutputHTMLPath, getOutputServerPreloadPath } from '../utils/paths'
import { join } from 'path'

export type RenderError = {
  statusCode: number
}

export type ServerRouteLoader = {
  type: 'server'
  load: () => Promise<{ default: ReamServerHandler }>
}

export const getServerMain = async (
  api: Ream
): Promise<{
  render: any
}> => {
  const mod = await api.viteDevServer?.ssrLoadModule(
    `/@fs/${api.resolveVueApp('server-entry.js')}`
  )
  return mod.default
}

export const getErrorComponent = async (api: Ream) => {
  return api.viteDevServer?.ssrLoadModule(`/@fs/${api.routesInfo.errorFile}`)
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
  const { routes } = api.routesInfo
  const { params, route } = findMatchedRoute(routes, req.path)
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
    if (route.isServerRoute) {
      const handler = await api.viteDevServer.ssrLoadModule(
        `/@fs/${route.absolutePath}`
      )
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
  const routeComponent = await api.viteDevServer.ssrLoadModule(
    `/@fs/${route.absolutePath}`
  )
  console.log('route component', routeComponent)
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
      console.log(req.path, req.url)
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

  const { render } = await getServerMain(api)
  const app = await render(context)
  const appHTML = await renderToString(app)
  const head: Head = app.config.globalProperties.$head
  const headHTML = renderHeadToString(head)
  const { default: getDocument } = await api.viteDevServer.ssrLoadModule(
    `/@fs/${api.routesInfo.documentFile}`
  )
  const noop = () => ''
  const html = await getDocument({
    head: () => `${headHTML.headTags}`,
    main: () => `<div id="_ream">${appHTML}</div>`,
    script: () => `
      <script>INITIAL_STATE=${serializeJavaScript(
        {
          pagePropsStore: context.pagePropsStore,
        },
        { isJSON: true }
      )}
      </script>
      <script type="module" src="/@vite/client"></script>
      <script type="module" src="/@fs/${api.resolveVueApp(
        'client-entry.js'
      )}"></script>`,
    htmlAttrs: noop,
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
      ...preloadResult?.props,
      ...serverPreloadResult?.props,
      ...staticPreloadResult?.props,
    },
  }
}
