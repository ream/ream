import { Router } from 'vue-router'
import { renderToString } from '@vue/server-renderer'
import serializeJavaScript from 'serialize-javascript'
import { Head, renderHeadToString } from '@vueuse/head'
import createDebug from 'debug'
import { Ream } from '../node'
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
  // @ts-ignore
  return api.viteDevServer?.ssrLoadModule(`/@fs/${api.routesInfo.errorFile}`)
}

type GetDocumentArgs = {
  head(): string
  main(): string
  scripts(): string
  htmlAttrs(): string
  bodyAttrs(): string
}

type ServerEntry = {
  render: any
  createClientRouter: (url: string) => Promise<Router>
  _document: () => Promise<{
    default: (args: GetDocumentArgs) => string | Promise<string>
  }>
}

export async function render(
  api: Ream,
  req: ReamServerRequest,
  res: ReamServerResponse,
  next: NextFunction,
  {
    ssrManifest,
    serverEntry,
    isPreloadRequest,
  }: {
    ssrManifest?: any
    serverEntry: ServerEntry
    isPreloadRequest?: boolean
  }
) {
  const router = await serverEntry.createClientRouter(req.url)
  const matchedRoutes = router.currentRoute.value.matched

  if (matchedRoutes[0].name === '404') {
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
        ssrManifest,
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
    ssrManifest: any
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
  const { default: getDocument } = await options.serverEntry._document()
  const html = await getDocument({
    head: () => `${headHTML.headTags}`,
    main: () => `<div id="_ream">${appHTML}</div>`,
    scripts: () => `
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
    htmlAttrs: () => headHTML.htmlAttrs,
    bodyAttrs: () => headHTML.bodyAttrs,
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
