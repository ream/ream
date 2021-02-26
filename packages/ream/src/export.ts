import path from 'path'
import fs from 'fs-extra'
import type { ServerEntry } from '@ream/server'
import {
  render,
  extractClientManifest,
  writeCacheFiles,
  ExportInfo,
} from '@ream/server'
import { PromiseQueue } from '@egoist/promise-queue'
import { flattenRoutes } from './utils/flatten-routes'

function getHref(attrs: string) {
  const match = /href\s*=\s*(?:"(.*?)"|'(.*?)'|([^\s>]*))/.exec(attrs)
  return match && (match[1] || match[2] || match[3])
}

export const exportSite = async (dotReamDir: string, fullyExport?: boolean) => {
  const ssrManifest = require(path.join(
    dotReamDir,
    'manifest/ssr-manifest.json'
  ))
  const serverEntry: ServerEntry = require(path.join(
    dotReamDir,
    'server/server-entry.js'
  )).default

  const globalPreload = await serverEntry.getGlobalPreload()

  // Adding a global `preload` function in `_app.vue` will disable automatic static generation
  if (globalPreload && !fullyExport) return

  const { scripts, styles } = extractClientManifest(dotReamDir) || {
    scripts: '',
    styles: '',
  }

  const clientRoutes = await flattenRoutes(serverEntry.clientRoutes)

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
          console.warn(
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
      console.log(jobId)
      const result = await render({
        url,
        dotReamDir,
        ssrManifest,
        serverEntry,
        scripts,
        styles,
        exportInfo: {
          staticPaths: [],
          // Skip fallback check, force all static paths to render
          fallbackPathsRaw: clientRoutes.map((r) => r.path),
        },
      })

      // Crawl pages
      if (fullyExport) {
        for (const file of result.cacheFiles.keys()) {
          if (file.endsWith('.html')) {
            const html = result.cacheFiles.get(file)
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
      }

      await writeCacheFiles(result.cacheFiles)
    },
    { maxConcurrent: 100 }
  )

  for (const path of staticPaths) {
    queue.add(`Exporting ${path}`, path)
  }
  await queue.run()
}
