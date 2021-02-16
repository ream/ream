import polka from 'polka'
import { Server, createServer } from 'http'
import { join } from 'path'
import { remove } from 'fs-extra'
import { Ream } from 'ream/dist/node'
import getPort from 'get-port'
import puppeteer from 'puppeteer'
import serveStatic from 'serve-static'

export type ProductionApp = {
  teardown: () => Promise<void>
  visit: (path: string) => Promise<{ statusCode?: number; content?: string }>
}

export async function buildAndLaunch({
  appDir,
  dev,
  export: exportSite,
}: {
  appDir: string
  dev: boolean
  export?: boolean
}): Promise<ProductionApp> {
  await remove(join(appDir, '.ream'))
  const port = await getPort()
  const ream = new Ream({
    rootDir: appDir,
    dev: dev,
    server: {
      port,
    },
  })
  let server: Server | undefined
  if (exportSite) {
    await ream.build(true)
    const serveStaticHandler = serveStatic(ream.resolveDotReam('export')) as any
    const s = polka()
    s.use(serveStaticHandler)
    server = createServer(s.handler as any)
    server.listen(port, () => {
      console.log(`Serve exported site at http://localhost:${port}`)
    })
  } else {
    await ream.build()
    server = await ream.serve()
  }
  const browser = await puppeteer.launch({
    ignoreDefaultArgs: ['--disable-extensions'],
    args: ['--no-sandbox'],
  })
  return {
    async teardown() {
      server?.close()
      await browser.close()
    },
    async visit(path: string) {
      const page = await browser.newPage()
      const response = await page.goto(`http://localhost:${port}${path}`)
      return {
        statusCode: response?.status(),
        content: await response?.text(),
      }
    },
  }
}
