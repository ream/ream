import path from 'path'
import type { Router } from 'vue-router'
import { renderToString } from '@vue/server-renderer'
import serializeJavaScript from 'serialize-javascript'
import createDebug from 'debug'
import type { Preload } from '@ream/app'
import {
  ReamServerRequest,
  ReamServerResponse,
  ReamServerHandler,
} from './server'
import serializeJavascript from 'serialize-javascript'
import { getOutputHTMLPath, getStaticPreloadOutputPath } from './paths-helpers'
import { join } from 'path'
import type { ExportInfo, ServerEntry } from '.'
import { IS_PROD } from './constants'
import { readFile } from './fs'

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
  styles,
  exportInfo,
}: {
  url: string
  req?: ReamServerRequest
  res?: ReamServerResponse
  dotReamDir: string
  ssrManifest?: any
  serverEntry: ServerEntry
  isPreloadRequest?: boolean
  scripts: string
  styles: string
  exportInfo?: ExportInfo
}): Promise<{
  statusCode: number
  body: string
  headers: { [k: string]: string }
  cacheFiles: Map<string, string>
}> {
  const router = serverEntry.createClientRouter()
  router.push(url)
  await router.isReady()
  const matchedRoutes = router.currentRoute.value.matched
  let statusCode = 200
  const cacheFiles: Map<string, string> = new Map()

  if (matchedRoutes[0].name === '404') {
    statusCode = 404
  }

  const route = router.currentRoute.value
  if (req) {
    req.params = route.params
  }

  const globalPreload = await serverEntry.getGlobalPreload()

  const components = matchedRoutes.map((route: any) => route.components.default)
  const exportDir = path.join(dotReamDir, 'client')
  const staticHTMLPath = join(exportDir, getOutputHTMLPath(route.path))
  const staticPreloadOutputPath = join(
    exportDir,
    getStaticPreloadOutputPath(route.path)
  )
  // Export the page (HTML or preload JSON file) after the request
  const fullRawPath = route.matched.map((m) => m.path).join('/')
  const isExported = exportInfo?.staticPaths.includes(route.path)
  const shouldExport =
    IS_PROD &&
    !globalPreload &&
    components.every((component) => !component.$$preload)

  if (isPreloadRequest) {
    debug(`Rendering preload JSON`)
    const headers = {
      'content-type': 'application/json',
    }

    let body = ''

    // Try loading the export cache
    if (isExported) {
      body = await readFile(staticPreloadOutputPath, 'utf8')
    }

    // No cache is founded
    if (!body) {
      // Static pages that should not fallback to render on demand
      // Show 404
      if (shouldExport && !exportInfo?.fallbackPathsRaw.includes(fullRawPath)) {
        body = `{"data":{},"notFound": true}`
      } else {
        const preloadResult = await getPreloadData(globalPreload, components, {
          req,
          res,
          params: route.params,
        })
        if (statusCode === 404) {
          preloadResult.notFound = true
        }
        body = serializeJavascript(preloadResult, { isJSON: true })

        // Save the cache
        if (shouldExport) {
          cacheFiles.set(staticPreloadOutputPath, body)
        }
      }
    }

    return {
      headers,
      body,
      statusCode,
      cacheFiles,
    }
  }

  const headers = { 'content-type': 'text/html' }
  let body = ''
  if (isExported) {
    debug(`Rendering pre-geneated static HTML file`)
    body = await readFile(staticHTMLPath, 'utf8')
  } else {
    debug(`Rendering HTML for ${url} on the fly`)
    let preloadResult: PreloadResult
    if (shouldExport && !exportInfo?.fallbackPathsRaw.includes(fullRawPath)) {
      preloadResult = { notFound: true, data: {} }
    } else {
      preloadResult = await getPreloadData(globalPreload, components, {
        req,
        res,
        params: route.params,
      })
      if (statusCode === 404) {
        preloadResult.notFound = true
      }
    }

    body = await renderToHTML({
      params: route.params,
      url,
      path: route.path,
      req,
      res,
      preloadResult,
      serverEntry,
      router,
      ssrManifest,
      scripts,
      styles,
    })
    if (shouldExport) {
      cacheFiles.set(staticHTMLPath, body)
      if (preloadResult.hasPreload) {
        cacheFiles.set(
          staticPreloadOutputPath,
          serializeJavaScript(preloadResult, { isJSON: true })
        )
      }
    }
  }
  return { headers, body, statusCode, cacheFiles }
}

export async function renderToHTML(options: {
  params: any
  url: string
  path: string
  req?: any
  res?: any
  preloadResult: {
    [k: string]: any
  }
  router: Router
  serverEntry: ServerEntry
  ssrManifest: any
  scripts: string
  styles: string
}) {
  const scripts =
    options.scripts ||
    `<script type="module" src="/@vite/client"></script>
  <script type="module" src="/@fs/${require.resolve(
    `@ream/app/client-entry.js`
  )}"></script>`
  const context: {
    url: string
    initialState: any
    router: Router
    modules?: Set<string>
  } = {
    url: options.url,
    initialState: {},
    router: options.router,
  }
  context.initialState = {
    [options.path]: options.preloadResult,
  }

  const app = await options.serverEntry.render(context)
  const appHTML = await renderToString(app, context)
  const preloadLinks = context.modules
    ? renderPreloadLinks(context.modules, options.ssrManifest)
    : ''
  const headHTML = options.serverEntry.renderHeadToString(app)
  const { default: getDocument } = await options.serverEntry._document()
  const html = await getDocument({
    head: () => `${headHTML.headTags}${options.styles}${preloadLinks}`,
    main: () => `<div id="_ream">${appHTML}</div>`,
    scripts: () => `
      <script>INITIAL_STATE=${serializeJavaScript(context.initialState, {
        isJSON: true,
      })}
      </script>
      ${scripts}
      `,
    htmlAttrs: () => headHTML.htmlAttrs,
    bodyAttrs: () => headHTML.bodyAttrs,
  })

  return `<!DOCTYPE html>${html}`
}

type PreloadResult = {
  data: any
  hasPreload?: boolean
  isStatic?: boolean
  notFound?: boolean
  error?: { statusCode: number; stack?: string }
}

export async function getPreloadData(
  globalPreload: Preload | undefined,
  components: any[],
  options: { req?: ReamServerRequest; res?: ReamServerResponse; params: any }
): Promise<PreloadResult> {
  const data = {}
  let hasPreload: boolean = false
  let isStatic: boolean = !globalPreload
  let notFound: boolean | undefined
  let error: { statusCode: number; stack?: string } | undefined

  const fns: any[] = globalPreload ? [globalPreload] : []

  for (const component of components) {
    const preload = component.$$staticPreload || component.$$preload

    if (component.$$preload) {
      isStatic = false
    }

    if (preload) {
      fns.push(preload)
    }
  }

  if (fns.length > 0) {
    hasPreload = true

    for (const fn of fns) {
      try {
        const result = await fn({
          req: options.req,
          res: options.res,
          params: options.params,
        })
        if (result) {
          if (result.notFound) {
            notFound = true
          } else if (result.data) {
            Object.assign(data, result.data)
          } else if (result.error) {
            error = result.error
          }
        }
      } catch (_error) {
        error = {
          statusCode: 500,
          stack:
            process.env.NODE_ENV === 'production' ? undefined : _error.stack,
        }
      }
    }
  }

  return {
    data,
    hasPreload,
    isStatic,
    notFound,
    error,
  }
}
