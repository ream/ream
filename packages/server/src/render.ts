import type { Router } from 'vue-router'
import { renderToString } from '@vue/server-renderer'
import serializeJavaScript from 'serialize-javascript'
import type { Preload } from '@ream/app'
import {
  ReamServerRequest,
  ReamServerResponse,
  ReamServerHandler,
} from './server'
import type { GetInitialHTML, ServerEntry } from '.'

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

export async function render({
  url,
  req,
  res,
  ssrManifest,
  serverEntry,
  isPreloadRequest,
  getHtmlAssets,
  clientManifest,
  router,
  notFound,
}: {
  url: string
  req?: ReamServerRequest
  res?: ReamServerResponse
  ssrManifest?: any
  serverEntry: ServerEntry
  isPreloadRequest?: boolean
  getHtmlAssets: GetHtmlAssets
  clientManifest?: any
  router: Router
  /** Render the 404 page */
  notFound?: boolean
}): Promise<{
  html?: string
  preloadResult: PreloadResult
}> {
  let html: string | undefined
  let preloadResult: PreloadResult | undefined

  const route = router.currentRoute.value

  const globalPreload = await serverEntry.getGlobalPreload()

  const components = route.matched.map((route) => route.components.default)

  preloadResult = await getPreloadData(globalPreload, components, {
    req,
    res,
    params: route.params,
  })

  if (notFound || route.name === '404') {
    preloadResult.notFound = true
  }

  // Also render HTML if not only fetching .preload.json
  if (!isPreloadRequest) {
    html = await renderToHTML({
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
  }

  return { html, preloadResult }
}

export type GetHtmlAssets = (clientManifest?: any) => HtmlAssets

const getInitialHTML: GetInitialHTML = ({
  head,
  main,
  scripts,
  htmlAttrs,
  bodyAttrs,
}) => {
  return `
  <html${htmlAttrs}>
    <head>
      ${head}
    </head>
    <body${bodyAttrs}>
      ${main}
      ${scripts}
    </body>
  </html>
  `
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
    preload: {
      [options.path]: options.preloadResult,
    },
  }

  const app = await options.serverEntry.render(context)
  const appHTML = await renderToString(app, context)
  const preloadLinks = context.modules
    ? renderPreloadLinks(context.modules, options.ssrManifest)
    : ''
  const headHTML = options.serverEntry.renderHeadToString(app)
  const assets = options.getHtmlAssets(options.clientManifest)
  const getInitialHTMLContext = {
    head: `${headHTML.headTags}${assets.cssLinkTags}${preloadLinks}`,
    main: `<div id="_ream">${appHTML}</div>`,
    scripts: `
      <script>INITIAL_STATE=${serializeJavaScript(context.initialState, {
        isJSON: true,
      })}
      </script>
      ${assets.scriptTags}
      `,
    htmlAttrs: headHTML.htmlAttrs,
    bodyAttrs: headHTML.bodyAttrs,
  }
  let html = await options.serverEntry.enhanceServer.getInitialHTML(
    getInitialHTMLContext
  )
  if (!html) {
    html = await getInitialHTML(getInitialHTMLContext)
  }

  return `<!DOCTYPE html>${html}`
}

export type PreloadResult = {
  data: any
  hasPreload?: boolean
  isStatic?: boolean
  notFound?: boolean
  error?: { statusCode: number; message?: string }
  redirect?: { url: string; permanent?: boolean }
  revalidate?: number
  expiry?: number
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
  let error: { statusCode: number; message?: string } | undefined
  let redirect: PreloadResult['redirect'] | undefined
  let revalidate: number | undefined

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
          if (typeof result.revalidate === 'number') {
            revalidate = result.revalidate * 1000
          }
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
          message:
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
    revalidate,
    expiry: revalidate && revalidate + Date.now(),
  }
}
