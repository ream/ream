import path from 'path'
import fs from 'fs-extra'
import consola from 'consola'
import chalk from 'chalk'
import {
  render,
  productionGetHtmlAssets,
  ExportInfo,
  ExportCache,
} from '@ream/server'
import { PromiseQueue } from '@egoist/promise-queue'
import { flattenRoutes } from './utils/flatten-routes'

function getHref(attrs: string) {
  const match = /href\s*=\s*(?:"(.*?)"|'(.*?)'|([^\s>]*))/.exec(attrs)
  return match && (match[1] || match[2] || match[3])
}

export const exportSite = async (dotReamDir: string, fullyExport?: boolean) => {
  const exportDir = path.join(dotReamDir, 'client')

  const serverContext = require(path.join(dotReamDir, 'meta/server-context'))

  const globalPreload = await serverContext.serverEntry.getGlobalPreload()

  // Adding a global `preload` function in `_app.vue` will disable automatic static generation
  if (globalPreload && !fullyExport) return

  const clientRoutes = await flattenRoutes(
    serverContext.serverEntry.clientRoutes
  )

  const staticPaths: string[] = []
  const exportInfo: ExportInfo = { staticPaths, fallbackPathsRaw: [] }

  await Promise.all(
    clientRoutes.map(async (route) => {
      const shouldExport = route.matched.every((m) => !m.preload)

      if (!shouldExport) {
        return
      }

      if (route.path === '/:404(.*)') {
        staticPaths.push('/404.html')
      } else if (route.path.includes(':')) {
        const paths = []
        let fallback = false

        for (const m of route.matched) {
          if (m.getStaticPaths) {
            const res = await m.getStaticPaths()
            paths.push(...res.paths)
            if (res.fallback != null) {
              fallback = res.fallback
            }
          }
        }

        if (paths.length === 0) {
          consola.warn(
            `No static paths provided for ${route.path}, skipped exporting`
          )
        }

        for (const path of paths) {
          const staticPath = route.path
            .replace('(.*)', '')
            .replace(/:([^\/]+)/g, (_, p1) => path.params[p1])
          staticPaths.push(staticPath)
        }
        if (fallback) {
          exportInfo.fallbackPathsRaw.push(route.path)
        }
      } else {
        staticPaths.push(route.path)
      }
    })
  )

  await fs.outputFile(
    path.join(dotReamDir, 'meta/export-info.json'),
    JSON.stringify(exportInfo),
    'utf8'
  )

  const queue = new PromiseQueue<[string]>(
    async (jobId, url) => {
      consola.info(chalk.dim(jobId))
      const exportCache = new ExportCache({
        exportDir: exportDir,
        flushToDisk: true,
      })

      await render({
        url,
        ssrManifest: serverContext.ssrManifest,
        serverEntry: serverContext.serverEntry,
        clientManifest: serverContext.clientManifest,
        getHtmlAssets: productionGetHtmlAssets,
        exportCache,
        exportInfo: {
          staticPaths: [],
          // Skip fallback check, force all static paths to render
          fallbackPathsRaw: clientRoutes.map((r) => r.path),
        },
      })

      // Crawl pages
      if (fullyExport) {
        for (const routePath of exportCache.cache.keys()) {
          const item = exportCache.cache.items[routePath]!
          const html = item.value.html
          if (html) {
            // find all `<a>` tags in exported html files and export links that are not yet exported
            let match: RegExpExecArray | null = null
            const LINK_RE = /<a ([\s\S]+?)>/gm
            while ((match = LINK_RE.exec(html))) {
              const href = getHref(match[1])
              if (href) {
                const url = new URL(href, 'http://self')
                if (url.host === 'self') {
                  queue.add(`Exporting ${url.pathname}`, url.pathname)
                }
              }
            }
          }
        }
      }
    },
    { maxConcurrent: 100 }
  )

  for (const path of staticPaths) {
    queue.add(`Exporting ${path}`, path)
  }
  await queue.run()

  if (fullyExport) {
    consola.success(
      `Your app has been exported to ${path.relative(
        process.cwd(),
        path.join(dotReamDir, 'client')
      )}`
    )
  }
}
