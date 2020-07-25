import { fetch } from 'ream/fetch'
import { Ream } from './node'
import { join, relative } from 'path'
import { parse as parseUrl } from 'url'
import { outputFile, copy, remove } from 'fs-extra'
import { createServer } from 'http'
import { PromiseQueue } from './utils/promise-queue'

function pathToFile(path: string, isServerRoute?: boolean) {
  if (isServerRoute) {
    // Remove trailing slash for api routes
    return path.replace(/(.+)\/$/, '$1')
  }

  return path.endsWith('.html')
    ? path
    : `${path.endsWith('/') ? path.slice(0, -1) : path}/index.html`
}

function getHref(attrs: string) {
  const match = /href\s*=\s*(?:"(.*?)"|'(.*?)'|([^\s>]*))/.exec(attrs)
  return match && (match[1] || match[2] || match[3])
}

export async function exportSite(api: Ream) {
  // Start a production server
  const server = createServer(await api.getRequestHandler())
  server.listen(api.serverOptions.port)

  const exportDir = api.resolveDotReam('export')
  await remove(exportDir)

  // Copy assets
  await copy(api.resolveDotReam('client'), join(exportDir, '_ream'))

  // Export static HTML files and API routes
  api.exportedServerRoutes = new Set()

  const staticRoutes = api.routes.filter(
    (route) => route.isClientRoute && !route.routePath.includes(':')
  )

  const exportHander = async (
    _: string,
    path: string,
    isServerRoute?: boolean
  ) => {
    const file = pathToFile(path, isServerRoute)
    const outPath = join(exportDir, file)
    console.log(`Exporting ${isServerRoute ? 'server route' : 'page'} ${path}`)
    const html = await fetch(path).then((res) => res.text())

    if (!isServerRoute) {
      // find all `<a>` tags in exported html files and export links that are not yet exported
      let match: RegExpExecArray | null = null
      const LINK_RE = /<a ([\s\S]+?)>/gm
      while ((match = LINK_RE.exec(html))) {
        const href = getHref(match[1])
        if (href) {
          const parsed = parseUrl(href)
          if (!parsed.host && parsed.pathname) {
            queue.add(`export ${parsed.pathname}`, parsed.pathname)
          }
        }
      }
    }

    await outputFile(outPath, html, 'utf8')
  }

  const queue = new PromiseQueue(exportHander, {
    maxConcurrent: 100,
  })

  for (const route of staticRoutes) {
    queue.add(`export ${route.routePath}`, route.routePath)
  }

  await queue.run()

  // export server routes that are request by pages
  if (api.exportedServerRoutes.size > 0) {
    for (const path of api.exportedServerRoutes) {
      queue.add(`export ${path}`, path, true)
    }
    await queue.run()
  }

  // Close server
  // Enjoy your static site
  server.close()

  console.log(`Done, exported to ${relative(process.cwd(), exportDir)}`)
}
