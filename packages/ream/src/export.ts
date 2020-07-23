import { Ream } from '.'
import { join, relative } from 'path'
import { outputFile, copy, remove } from 'fs-extra'
import fetch from '@ream/fetch'
import { createServer } from 'http'

function pathToFile(path: string) {
  return path.endsWith('.html')
    ? path
    : `${path.endsWith('/') ? path.slice(0, -1) : path}/index.html`
}

export async function exportSite(api: Ream) {
  // Start a production server
  const server = createServer(await api.getRequestHandler())
  server.listen(api.serverOptions.port)

  const exportDir = api.resolveDotReam('export')
  await remove(exportDir)

  // Copy assets
  await copy(api.resolveDotReam('client'), join(exportDir, '_ream'))

  // Export static HTML files
  const staticRoutes = api.routes.filter(
    (route) => route.isClientRoute && !route.routePath.includes(':')
  )
  await Promise.all(
    staticRoutes.map(async (route) => {
      const file = pathToFile(route.routePath)
      const outPath = join(exportDir, file)
      console.log(`Exporting ${route.routePath}`)
      const html = await fetch(route.routePath).then((res) => res.text())
      await outputFile(outPath, html, 'utf8')
    })
  )

  // TODO: find all `<a>` tags in exported html files and export links that are not yet exported

  // TODO: export api routes that are request by pages

  // Close server
  // Enjoy your static site
  server.close()

  console.log(`Done, exported to ${relative(process.cwd(), exportDir)}`)
}
