import { Router } from 'vue-router'
import { renderToString } from '@vue/server-renderer'
import serializeJavaScript from 'serialize-javascript'
import { Head, renderHeadToString } from '@vueuse/head'
import createDebug from 'debug'
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
import { getOutputHTMLPath, getStaticPreloadOutputPath } from '../utils/paths'
import { join } from 'path'

const debug = createDebug('ream:render')

export type RenderError = {
  statusCode: number
}

export type ServerRouteLoader = {
  type: 'server'
  load: () => Promise<{ default: ReamServerHandler }>
}

export const getErrorComponent = async (api: Ream) => {
  return api.viteDevServer?.ssrLoadModule(`/@fs/${api.routesInfo.errorFile}`)
}

type ServerEntry = {
  render: any
  createClientRouter: (url: string) => Promise<Router>
}

export async function render(
  api: Ream,
  req: ReamServerRequest,
  res: ReamServerResponse,
  next: NextFunction,
  {
    clientManifest,
    isPreloadRequest,
  }: { clientManifest?: ClientManifest; isPreloadRequest?: boolean }
) {
  const serverEntry: ServerEntry = await api.viteDevServer
    .ssrLoadModule(`@own-app-dir/server-entry.js`)
    .then((res) => res.default)

  const router = await serverEntry.createClientRouter(req.url)
  const matchedRoutes = router.currentRoute.value.matched

  if (matchedRoutes[0].path === '/:404(.*)') {
    res.statusCode = 404
  }

  const { params } = router.currentRoute.value
  req.params = params

  if (req.method !== 'GET') {
    return res.end('unsupported method')
  }

  const components = matchedRoutes.map((route) => route.components.default)
  const exportDir = api.resolveDotReam('export')
  const staticHTMLPath = join(exportDir, getOutputHTMLPath(req.path))
  const staticPreloadOutputPath = join(
    exportDir,
    getStaticPreloadOutputPath(req.path)
  )
  // Export the page as static HTML after request
  const shouldExport =
    components.every((component) => !component.$$preload) && !api.isDev
  // If there's already a exported static HTML file
  const hasStaticHTML = shouldExport && (await pathExists(staticHTMLPath))
  if (isPreloadRequest) {
    debug(`Rendering preload JSON`)
    res.setHeader('content-type', 'application/json')
    if (hasStaticHTML) {
      res.end(await readFile(staticPreloadOutputPath, 'utf8'))
    } else {
      const { props } = await getPreloadData(components, {
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
      debug(`Rendering pre-geneated static HTML file`)
      const html = await readFile(staticHTMLPath, 'utf8')
      res.end(html)
    } else {
      debug(`Rendering HTML for ${req.url} on the fly`)
      const { props } = await getPreloadData(components, {
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
        serverEntry,
        router,
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
    router: Router
    serverEntry: ServerEntry
    clientManifest: ClientManifest
  }
) {
  const context: { url: string; pagePropsStore: any; router: Router } = {
    url: options.url,
    pagePropsStore: {},
    router: options.router,
  }
  context.pagePropsStore = {
    [options.path]: options.props,
  }

  const app = await options.serverEntry.render(context)
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
  components: any[],
  options: { req?: ReamServerRequest; res?: ReamServerResponse; params: any }
) {
  const props = {}
  for (const component of components) {
    const preload = component.$$staticPreload || component.$$preload
    const result =
      preload &&
      (await preload({
        req: options.req,
        res: options.res,
        params: options.params,
      }))
    if (result) {
      Object.assign(props, result.props)
    }
  }
  return {
    props,
  }
}
