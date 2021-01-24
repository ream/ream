import { createRouter, createMemoryHistory } from 'vue-router'
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
  const { clientRoutes } = await api.viteDevServer.ssrLoadModule(
    `/.ream/templates/client-routes.js`
  )
  const router = createRouter({
    history: createMemoryHistory(),
    routes: clientRoutes,
  })
  router.push(req.url)
  await router.isReady()
  const route =
    router.currentRoute.value.matched[
      router.currentRoute.value.matched.length - 1
    ]

  // TODO: set status code for 404 pages

  const { params, query } = router.currentRoute.value
  req.params = params
  req.query = query as any

  if (req.method !== 'GET') {
    return res.end('unsupported method')
  }

  const component = route.components.default as any
  const exportDir = api.resolveDotReam('export')
  const staticHTMLPath = join(exportDir, getOutputHTMLPath(req.path))
  const staticPreloadOutputPath = join(
    exportDir,
    getOutputServerPreloadPath(req.path)
  )
  const shouldExport =
    !component.preload && !component.serverPreload && !api.isDev
  const hasStaticHTML = shouldExport && (await pathExists(staticHTMLPath))
  if (isServerPreload) {
    res.setHeader('content-type', 'application/json')
    if (hasStaticHTML) {
      res.end(await readFile(staticPreloadOutputPath, 'utf8'))
    } else {
      const { props } = await getPreloadData(component, {
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
      const { props } = await getPreloadData(component, {
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
