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

function renderPreloadLinks(modules: Set<string>, manifest: any): string {
  let links = ''
  const seen = new Set()
  modules.forEach((id) => {
    const files: string[] | undefined = manifest[id]
    if (files) {
      files.forEach((file) => {
        if (!seen.has(file)) {
          seen.add(file)
          links += renderPreloadLink(file)
        }
      })
    }
  })
  return links
}

function renderPreloadLink(file: string): string {
  if (file.endsWith('.js')) {
    return `<link rel="modulepreload" crossorigin href="${file}">`
  } else if (file.endsWith('.css')) {
    return `<link rel="stylesheet" href="${file}">`
  } else {
    // TODO
    return ''
  }
}

export async function render({
  url,
  req,
  res,
  dotReamDir,
  ssrManifest,
  serverEntry,
  isPreloadRequest,
  scripts,
}: {
  url: string
  req?: ReamServerRequest
  res?: ReamServerResponse
  dotReamDir: string
  ssrManifest?: any
  serverEntry: ServerEntry
  isPreloadRequest?: boolean
  scripts?: string
}): Promise<{
  statusCode: number
  body: string
  headers: { [k: string]: string }
}> {
  const router = await serverEntry.createClientRouter(url)
  const matchedRoutes = router.currentRoute.value.matched
  let statusCode = 200

  if (matchedRoutes[0].name === '404') {
    statusCode = 404
  }

  const route = router.currentRoute.value
  if (req) {
    req.params = route.params
  }

  const components = matchedRoutes.map((route) => route.components.default)
  const exportDir = path.join(dotReamDir, 'export')
  const staticHTMLPath = join(exportDir, getOutputHTMLPath(route.path))
  const staticPreloadOutputPath = join(
    exportDir,
    getStaticPreloadOutputPath(route.path)
  )
  // Export the page as static HTML after request
  const shouldExport =
    // @ts-ignore
    components.every((component) => !component.$$preload) && IS_PROD
  // If there's already a exported static HTML file
  const hasStaticHTML = shouldExport && (await pathExists(staticHTMLPath))
  if (isPreloadRequest) {
    debug(`Rendering preload JSON`)
    const headers = {
      'content-type': 'application/json',
    }

    let body = ''

    if (hasStaticHTML) {
      body = await readFile(staticPreloadOutputPath, 'utf8')
    } else {
      const preloadResult = await getPreloadData(components, {
        req,
        res,
        params: route.params,
      })
      body = serializeJavascript(preloadResult, { isJSON: true })
      if (shouldExport) {
        outputFile(staticPreloadOutputPath, body, 'utf8').catch(console.error)
      }
    }

    return {
      headers,
      body,
      statusCode,
    }
  }

  const headers = { 'content-type': 'text/html' }
  let body = ''
  if (hasStaticHTML) {
    debug(`Rendering pre-geneated static HTML file`)
    body = await readFile(staticHTMLPath, 'utf8')
  } else {
    debug(`Rendering HTML for ${url} on the fly`)
    const preloadResult = await getPreloadData(components, {
      req,
      res,
      params: route.params,
    })
    const html = await renderToHTML({
      params: route.params,
      url,
      path: route.path,
      req,
      res,
      pageData: preloadResult.data,
      serverEntry,
      router,
      ssrManifest,
      scripts,
    })
    body = `<!DOCTYPE>${html}`
    if (shouldExport) {
      outputFile(staticHTMLPath, body, 'utf8').catch(console.error)
    }
  }
  return { headers, body, statusCode }
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
  scripts?: string
}) {
  const scripts =
    options.scripts ||
    `<script type="module" src="/@vite/client"></script>
  <script type="module" src="/@fs/${require.resolve(
    `@ream/vue-app/client-entry.js`
  )}"></script>`
  const context: {
    url: string
    pageDataStore: any
    router: Router
    modules?: Set<string>
  } = {
    url: options.url,
    pageDataStore: {},
    router: options.router,
  }
  context.pageDataStore = {
    [options.path]: options.pageData,
  }

  const app = await options.serverEntry.render(context)
  const appHTML = await renderToString(app, context)
  const preloadLinks = context.modules
    ? renderPreloadLinks(context.modules, options.ssrManifest)
    : ''
  const head: Head = app.config.globalProperties.$head
  const headHTML = renderHeadToString(head)
  const { default: getDocument } = await options.serverEntry._document()
  const html = await getDocument({
    head: () => `${headHTML.headTags}${preloadLinks}`,
    main: () => `<div id="_ream">${appHTML}</div>`,
    scripts: () => `
      <script>INITIAL_STATE=${serializeJavaScript(
        {
          pageDataStore: context.pageDataStore,
        },
        { isJSON: true }
      )}
      </script>
      ${scripts}
      `,
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
