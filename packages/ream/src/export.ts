import { Ream } from './node'
import { join, relative } from 'path'
import { parse as parseUrl } from 'url'
import { outputFile, copy } from 'fs-extra'
import { PromiseQueue } from './utils/promise-queue'
import { Route } from './utils/route'
import {
  renderToHTML,
  getServerMain,
  ClientRouteLoader,
  getPreloadData,
} from './server/render'
import {
  findMatchedRoute,
  compileToPath,
  getParams,
} from './utils/route-helpers'
import serializeJavascript from 'serialize-javascript'
import { getOutputHTMLPath, getOutputServerPreloadPath } from './utils/paths'

function getHref(attrs: string) {
  const match = /href\s*=\s*(?:"(.*?)"|'(.*?)'|([^\s>]*))/.exec(attrs)
  return match && (match[1] || match[2] || match[3])
}

export async function exportSite(
  api: Ream,
  options: { crawl?: boolean; type: 'build' | 'export' }
) {
  const exportDir = api.resolveDotReam('export')

  // Copy assets
  await copy(api.resolveDotReam('client'), join(exportDir, '_ream'))

  // Export static HTML files and API routes
  api.exportedServerRoutes = new Set()

  const exportHander = async (
    _: string,
    { route, path, params }: { route: Route; path?: string; params?: any }
  ) => {
    const { routes } = getServerMain(api)
    const routeLoader = routes[route.entryName] as ClientRouteLoader
    const exported = await routeLoader.load()
    const hasDynamicSegment = route.routePath.includes(':')

    if (route.is404) {
      path = '/404.html'
    }

    if (exported.serverPreload || exported.preload) {
      if (options.type === 'export') {
        // Only allow `staticPreload` for full static export
        throw new Error(
          `You can't use serverPreload or preload in export command, use staticPreload instead`
        )
      }
      return
    }

    if (!path) {
      if (hasDynamicSegment) {
        if (exported.staticPaths) {
          const { paths } = await exported.staticPaths()
          for (const p of paths) {
            const staticPath = compileToPath(route.routePath, p.params)
            queue.add(`export ${staticPath}`, {
              route,
              path: staticPath,
              params: p.params,
            })
          }
        }
        return
      }

      path = route.routePath
    }

    console.log(`Exporting page ${path}`)

    params = params || getParams(path, route.routePath)

    const { props } = await getPreloadData(exported, { params })
    const html = await renderToHTML(api, {
      params,
      url: path,
      path,
      props,
      clientManifest: require(api.resolveDotReam(
        'client/client-manifest.json'
      )),
    })

    if (options.crawl) {
      // find all `<a>` tags in exported html files and export links that are not yet exported
      let match: RegExpExecArray | null = null
      const LINK_RE = /<a ([\s\S]+?)>/gm
      while ((match = LINK_RE.exec(html))) {
        const href = getHref(match[1])
        if (href) {
          const parsed = parseUrl(href)
          if (!parsed.host && parsed.pathname) {
            const { route, params } = findMatchedRoute(
              api.routes,
              parsed.pathname
            )
            if (route && params) {
              queue.add(`export ${parsed.pathname}`, {
                path: parsed.pathname,
                route,
                params,
              })
            }
          }
        }
      }
    }

    const outPath = join(exportDir, getOutputHTMLPath(path))
    await outputFile(outPath, html, 'utf8')

    if (exported.staticPreload) {
      const dataOutPath = join(exportDir, getOutputServerPreloadPath(path))
      await outputFile(
        dataOutPath,
        serializeJavascript(props, {
          isJSON: true,
        }),
        'utf8'
      )
    }
  }

  const queue = new PromiseQueue<
    [{ path?: string; params?: any; route: Route }]
  >(exportHander, {
    maxConcurrent: 100,
  })

  for (const route of api.routes) {
    if (route.isClientRoute) {
      queue.add(`export ${route.routePath}`, {
        route,
      })
    }
  }

  await queue.run()

  console.log(`Done, exported to ${relative(process.cwd(), exportDir)}`)
}
