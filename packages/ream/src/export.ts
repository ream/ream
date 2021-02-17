import path from 'path'
import type { ServerEntry } from '@ream/server'
import { render, extractClientManifest, writeCacheFiles } from '@ream/server'
import { PromiseQueue } from '@egoist/promise-queue'

function getHref(attrs: string) {
  const match = /href\s*=\s*(?:"(.*?)"|'(.*?)'|([^\s>]*))/.exec(attrs)
  return match && (match[1] || match[2] || match[3])
}

export const exportSite = async (dotReamDir: string) => {
  const ssrManifest = require(path.join(
    dotReamDir,
    'manifest/ssr-manifest.json'
  ))
  const serverEntry: ServerEntry = require(path.join(
    dotReamDir,
    'server/server-entry.js'
  )).default
  const { scripts, styles } = extractClientManifest(dotReamDir) || {
    scripts: '',
    styles: '',
  }

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
      })
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
      await writeCacheFiles(result.cacheFiles)
    },
    { maxConcurrent: 100 }
  )

  queue.add('Exporting /', '/')
  queue.add('Exporting /404.html', '/404.html')
  await queue.run()
}
