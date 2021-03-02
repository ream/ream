import type { Router } from 'vue-router'
import { renderToString } from '@vue/server-renderer'
import serializeJavaScript from 'serialize-javascript'
import type { Preload } from '@ream/app'
import {
  ReamServerRequest,
  ReamServerResponse,
  ReamServerHandler,
} from './server'
import serializeJavascript from 'serialize-javascript'
import type { ExportInfo, ServerEntry } from '.'
import { ExportCache } from './export-cache'

export type RenderError = {
  statusCode: number
}

export type ServerRouteLoader = {
  type: 'server'
  load: () => Promise<{ default: ReamServerHandler }>
}

function renderPreloadLinks(modules: Set<string>, manifest?: any): string {
  let links = ''
  if (!manifest) {
    return links
  }
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

export type HtmlAssets = {
  scriptTags: string
  cssLinkTags: string
}

type PreloadRedirect = { url: string; permanent?: boolean }

export async function render({
  url,
  req,
  res,
  ssrManifest,
  serverEntry,
  isPreloadRequest,
  getHtmlAssets,
  clientManifest,
  exportInfo,
  exportCache,
}: {
  url: string
  req?: ReamServerRequest
  res?: ReamServerResponse
  ssrManifest?: any
  serverEntry: ServerEntry
  isPreloadRequest?: boolean
  getHtmlAssets: GetHtmlAssets
  clientManifest?: any
  exportInfo?: ExportInfo
  exportCache: ExportCache
}): Promise<{
  statusCode: number
  body: string
  headers: { [k: string]: string }
  redirect?: PreloadRedirect
}> {
  const router = serverEntry.createClientRouter()
  router.push(url)
  await router.isReady()
  const matchedRoutes = router.currentRoute.value.matched
  let body = ''
  let statusCode = 200
  let redirect: PreloadRedirect | undefined
  const headers: { [k: string]: string } = {}

  if (matchedRoutes[0].name === '404') {
    statusCode = 404
  }

  const route = router.currentRoute.value
  if (req) {
    req.params = route.params
  }

  const globalPreload = await serverEntry.getGlobalPreload()

  const components = matchedRoutes.map((route: any) => route.components.default)

  // Export the page (HTML or preload JSON file) after the request
  const fullRawPath = route.matched.map((m) => m.path).join('/')
  const shouldExport =
    process.env.NODE_ENV === 'production' &&
    !globalPreload &&
    components.every((component) => !component.$$preload)

  if (isPreloadRequest) {
    headers['content-type'] = 'application/json'
  } else {
    headers['content-type'] = 'text/html'
  }

  // Try using the cache
  if (shouldExport) {
    const pageCache = await exportCache.get(route.path)
    if (pageCache) {
      if (isPreloadRequest) {
        body = serializeJavascript(pageCache.preloadResult, { isJSON: true })
      } else {
        body = pageCache.html || ''
      }
    }
  }

  // `body` is still empty means there's no cache
  // Then renders it on the fly
  if (!body) {
    const fallbackToDynamicRendering =
      !shouldExport || exportInfo?.fallbackPathsRaw.includes(fullRawPath)

    if (!fallbackToDynamicRendering) {
      statusCode = 404
    }

    const preloadResult: PreloadResult = fallbackToDynamicRendering
      ? await getPreloadData(globalPreload, components, {
          req,
          res,
          params: route.params,
        })
      : { data: {} }

    if (statusCode === 404) {
      preloadResult.notFound = true
    }
    if (isPreloadRequest) {
      // Render .preload.json on the fly
      body = serializeJavascript(preloadResult, { isJSON: true })

      if (shouldExport) {
        exportCache.set(route.path, { preloadResult })
      }
    } else {
      // Render HTML on the fly
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
        clientManifest,
        getHtmlAssets,
      })

      if (shouldExport) {
        exportCache.set(route.path, {
          preloadResult,
          html: body,
        })
      }
    }
  }

  return { headers, body, statusCode, redirect }
}

export type GetHtmlAssets = (clientManifest?: any) => HtmlAssets

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
  ssrManifest?: any
  clientManifest?: any
  getHtmlAssets: GetHtmlAssets
}) {
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
  const assets = options.getHtmlAssets(options.clientManifest)
  const html = await getDocument({
    head: () => `${headHTML.headTags}${assets.cssLinkTags}${preloadLinks}`,
    main: () => `<div id="_ream">${appHTML}</div>`,
    scripts: () => `
      <script>INITIAL_STATE=${serializeJavaScript(context.initialState, {
        isJSON: true,
      })}
      </script>
      ${assets.scriptTags}
      `,
    htmlAttrs: () => headHTML.htmlAttrs,
    bodyAttrs: () => headHTML.bodyAttrs,
  })

  return `<!DOCTYPE html>${html}`
}

export type PreloadResult = {
  data: any
  hasPreload?: boolean
  isStatic?: boolean
  notFound?: boolean
  error?: { statusCode: number; stack?: string }
  redirect?: { url: string; permanent?: boolean }
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
  let redirect: PreloadResult['redirect'] | undefined

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
          } else if (result.redirect) {
            redirect =
              typeof result.redirect === 'string'
                ? { url: result.redirect }
                : result.redirect
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
    redirect,
  }
}
