import path from 'path'
import type { Router } from 'vue-router'
import { renderToString } from '@vue/server-renderer'
import serializeJavaScript from 'serialize-javascript'
import { Head, renderHeadToString } from '@vueuse/head'
import createDebug from 'debug'
import {
  ReamServerRequest,
  ReamServerResponse,
  ReamServerHandler,
} from './server'
import { NextFunction } from 'connect'
import { readFile, pathExists, outputFile } from 'fs-extra'
import serializeJavascript from 'serialize-javascript'
import { getOutputHTMLPath, getStaticPreloadOutputPath } from './paths-helpers'
import { join } from 'path'
import type { ServerEntry } from '.'
import { IS_PROD } from './constants'

const debug = createDebug('ream:render')

export type RenderError = {
  statusCode: number
}

export type ServerRouteLoader = {
  type: 'server'
  load: () => Promise<{ default: ReamServerHandler }>
}

export async function render(
  req: ReamServerRequest,
  res: ReamServerResponse,
  next: NextFunction,
  {
    dotReamDir,
    ssrManifest,
    serverEntry,
    isPreloadRequest,
  }: {
    dotReamDir: string
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
  const exportDir = path.join(dotReamDir, 'export')
  const staticHTMLPath = join(exportDir, getOutputHTMLPath(req.path))
  const staticPreloadOutputPath = join(
    exportDir,
    getStaticPreloadOutputPath(req.path)
  )
  // Export the page as static HTML after request
  const shouldExport =
    components.every((component) => !component.$$preload) && IS_PROD
  // If there's already a exported static HTML file
  const hasStaticHTML = shouldExport && (await pathExists(staticHTMLPath))
  if (isPreloadRequest) {
    debug(`Rendering preload JSON`)
    res.setHeader('content-type', 'application/json')
    if (hasStaticHTML) {
      res.end(await readFile(staticPreloadOutputPath, 'utf8'))
    } else {
      const preloadResult = await getPreloadData(components, {
        req,
        res,
        params: req.params,
      })
      const result = serializeJavascript(preloadResult, { isJSON: true })
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
      const preloadResult = await getPreloadData(components, {
        req,
        res,
        params: req.params,
      })
      const html = await renderToHTML({
        params: req.params,
        url: req.url,
        path: req.path,
        req,
        res,
        pageData: preloadResult.data,
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

export async function renderToHTML(options: {
  params: any
  url: string
  path: string
  req?: any
  res?: any
  pageData: {
    [k: string]: any
  }
  router: Router
  serverEntry: ServerEntry
  ssrManifest: any
}) {
  const context: { url: string; pageDataStore: any; router: Router } = {
    url: options.url,
    pageDataStore: {},
    router: options.router,
  }
  context.pageDataStore = {
    [options.path]: options.pageData,
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
          pageDataStore: context.pageDataStore,
        },
        { isJSON: true }
      )}
      </script>
      <script type="module" src="/@vite/client"></script>
      <script type="module" src="/@fs/${require.resolve(
        `@ream/vue-app/client-entry.js`
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
  const data = {}
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
      Object.assign(data, result.data)
    }
  }
  return {
    data,
  }
}
