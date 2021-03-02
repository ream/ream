import polka from 'polka'
import path from 'path'
import execa from 'execa'
import { Server, createServer } from 'http'
import { join } from 'path'
import { remove } from 'fs-extra'
import { createServer as createReamServer } from '@ream/server'
import getPort from 'get-port'
import { chromium } from 'playwright-chromium'
import serveStatic from 'serve-static'

export type ProductionApp = {
  teardown: () => Promise<void>
  visit: (path: string) => Promise<{ statusCode?: number; content?: string }>
}

const REAM_BIN = require.resolve('ream/cli.js')

export async function buildAndLaunch({
  appDir,
  export: exportSite,
}: {
  appDir: string
  dev: boolean
  export?: boolean
}): Promise<ProductionApp> {
  await remove(join(appDir, '.ream'))
  const port = await getPort()
  let server: Server | undefined
  if (exportSite) {
    await execa(REAM_BIN, ['export'], { cwd: appDir })
    const serveStaticHandler = serveStatic(
      path.join(appDir, '.ream/client')
    ) as any
    const s = polka()
    s.use(serveStaticHandler)
    server = createServer(s.handler as any)
  } else {
    await execa(REAM_BIN, ['build'], { cwd: appDir })
    server = createServer(
      await createReamServer({
        cwd: appDir,
        context: require(path.join(appDir, '.ream/meta/server-context')),
      })
    )
  }
  server.listen(port, () => {
    // console.log(`Serve site at http://localhost:${port}`)
  })
  const browser = await chromium.launch({
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
