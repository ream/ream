import path from 'path'
import fs from 'fs-extra'
import consola from 'consola'
import chalk from 'chalk'
import serializeJavascript from 'serialize-javascript'
import {
  render,
  productionGetHtmlAssets,
  ExportManifest,
  ServerContext,
  createClientRouter,
  getExportOutputPath,
} from '@ream/server'
import { PromiseQueue } from '@egoist/promise-queue'
import { flattenRoutes } from './utils/flatten-routes'

function getHref(attrs: string) {
  const match = /href\s*=\s*(?:"(.*?)"|'(.*?)'|([^\s>]*))/.exec(attrs)
  return match && (match[1] || match[2] || match[3])
}

export const exportSite = async (dotReamDir: string, fullyExport?: boolean) => {
  const exportDir = path.join(dotReamDir, fullyExport ? 'client' : 'export')

  const { serverContext }: { serverContext: ServerContext } = require(path.join(
    dotReamDir,
    'meta/server-context'
  ))

  const globalPreload = await serverContext.serverEntry.getGlobalPreload()

  // Adding a global `preload` function in `_app.vue` will disable automatic static generation
  if (globalPreload && !fullyExport) return

  const clientRoutes = await flattenRoutes(
    serverContext.serverEntry.clientRoutes
  )

  const staticPaths: string[] = []
  const exportManifest: ExportManifest = { staticPages: [] }

  await Promise.all(
    clientRoutes.map(async (route) => {
      const shouldExport = route.matched.every((m) => !m.preload)

      if (!shouldExport) {
        return
      }

      if (route.path === '/:404(.*)') {
        staticPaths.push('/404.html')
      } else {
        const isDynamicPath = route.path.includes(':')
        let fallback = false

        const isStatic = route.matched.every((m) => !m.preload)

        if (!isStatic) return

        if (isDynamicPath) {
          const paths = []
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
        } else {
          staticPaths.push(route.path)
        }

        exportManifest.staticPages.push({ path: route.path, fallback })
      }
    })
  )

  await fs.outputFile(
    path.join(dotReamDir, 'manifest/export-manifest.json'),
    JSON.stringify(exportManifest),
    'utf8'
  )

  const queue = new PromiseQueue<[string]>(
    async (jobId, url) => {
      consola.info(chalk.dim(jobId))

      const router = await createClientRouter(serverContext.serverEntry, url)

      const routePath = router.currentRoute.value.path
      const { html = '', preloadResult } = await render({
        url,
        ssrManifest: serverContext.ssrManifest,
        serverEntry: serverContext.serverEntry,
        clientManifest: serverContext.clientManifest,
        getHtmlAssets: productionGetHtmlAssets,
        router,
      })

      const htmlPath = getExportOutputPath(routePath, 'html', exportDir)
      const jsonPath = getExportOutputPath(routePath, 'json', exportDir)
      await Promise.all([
        fs.outputFile(htmlPath, html, 'utf8'),
        preloadResult.hasPreload &&
          preloadResult.isStatic &&
          (await fs.outputFile(
            jsonPath,
            serializeJavascript(preloadResult, { isJSON: true }),
            'utf8'
          )),
      ])

      // Crawl pages
      if (fullyExport) {
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
