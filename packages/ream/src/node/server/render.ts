import type { Router } from 'vue-router'
import { renderToString } from '@vue/server-renderer'
import serializeJavaScript from 'serialize-javascript'
import { ReamServerHandler } from './server'
import type { Load, LoadOptions, ServerEntry } from '.'

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
  loadOptions,
  ssrManifest,
  serverEntry,
  isLoadRequest,
  clientManifest,
  router,
  notFound,
  htmlTemplate,
}: {
  url: string
  loadOptions: LoadOptions
  ssrManifest?: any
  serverEntry: ServerEntry
  isLoadRequest?: boolean
  clientManifest?: any
  router: Router
  /** Render the 404 page */
  notFound?: boolean
  htmlTemplate: string
}): Promise<{
  html?: string
  loadResult: LoadResult
}> {
  let html: string | undefined
  let loadResult: LoadResult | undefined

  const route = router.currentRoute.value

  const globalLoad = await serverEntry.getGlobalLoad()

  const components = route.matched.map((route) => route.components.default)

  loadResult = await loadPageData(globalLoad, components, loadOptions)

  if (notFound || route.name === '404') {
    loadResult.notFound = true
  }

  // Also render HTML if not only fetching .load.json
  if (!isLoadRequest) {
    html = await renderToHTML({
      url,
      path: route.path,
      loadResult,
      serverEntry,
      router,
      ssrManifest,
      clientManifest,
      htmlTemplate,
    })
  }

  return { html, loadResult }
}

export async function renderToHTML(options: {
  url: string
  path: string
  loadResult: LoadResult
  router: Router
  serverEntry: ServerEntry
  ssrManifest?: any
  clientManifest?: any
  htmlTemplate: string
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
    load: {
      [options.path]: options.loadResult,
    },
  }

  const app = await options.serverEntry.render(context)
  const appHTML = await renderToString(app, context)
  const preloadLinks = context.modules
    ? renderPreloadLinks(context.modules, options.ssrManifest)
    : ''
  const headHTML = options.serverEntry.renderHead(app)

  const html = options.htmlTemplate
    .replace(' ream-html-attrs', headHTML.htmlAttrs)
    .replace(' ream-body-attrs', headHTML.bodyAttrs)
    .replace('<!--ream-head-->', `${headHTML.headTags}${preloadLinks}`)
    .replace(
      '<!--ream-main-->',
      `<div id="_ream">${appHTML}</div>
    <script>INITIAL_STATE=${serializeJavaScript(context.initialState, {
      isJSON: true,
    })}
    </script>
    `
    )

  return html
}

export type LoadResult = {
  props: any
  hasLoad?: boolean
  hasPreload?: boolean
  notFound?: boolean
  error?: { status: number; message?: string }
  redirect?: { url: string; permanent?: boolean }
  revalidate?: number
  expiry?: number
}

export async function loadPageData(
  globalLoad: Load | undefined,
  components: any[],
  options: LoadOptions
): Promise<LoadResult> {
  const props = {}
  let hasPreload: boolean | undefined
  let hasLoad: boolean | undefined
  let notFound: boolean | undefined
  let error: { status: number; message?: string } | undefined
  let redirect: LoadResult['redirect'] | undefined
  let revalidate: number | undefined

  const fns: any[] = globalLoad ? [globalLoad] : []

  for (const component of components) {
    if (component.$$load) {
      hasLoad = true
    }

    if (component.$$preload) {
      hasPreload = true
    }

    const load = component.$$load || component.$$preload

    if (load) {
      fns.push(load)
    }
  }

  if (fns.length > 0) {
    for (const fn of fns) {
      const result = await fn(options)
      if (result) {
        if (typeof result.revalidate === 'number') {
          revalidate = result.revalidate * 1000
        }

        if (result.props) {
          Object.assign(props, result.props)
          continue
        }

        if (result.notFound) {
          notFound = true
        } else if (result.redirect) {
          redirect =
            typeof result.redirect === 'string'
              ? { url: result.redirect }
              : result.redirect
        } else if (result.error) {
          error = result.error
        }
        break
      } else if (result == null) {
        notFound = true
        break
      }
    }
  }

  return {
    props,
    hasPreload,
    hasLoad,
    notFound,
    error,
    redirect,
    revalidate,
    expiry: revalidate && revalidate + Date.now(),
  }
}
