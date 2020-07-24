import { join } from 'path'
import { remove } from 'fs-extra'
import { Ream } from 'ream'
import getPort from 'get-port'
import puppeteer from 'puppeteer'

export type ProductionApp = {
  teardown: () => Promise<void>
  visit: (path: string) => Promise<{ statusCode?: number; html: string }>
}

export async function buildAndLaunch({
  appDir,
  dev,
}: {
  appDir: string
  dev: boolean
}): Promise<ProductionApp> {
  await remove(join(appDir, '.ream'))
  const port = await getPort()
  const ream = new Ream({
    dir: appDir,
    dev: dev,
    server: {
      port,
    },
  })
  await ream.build()
  const server: any = await ream.serve()
  const browser = await puppeteer.launch({
    ignoreDefaultArgs: ['--disable-extensions'],
    args: ['--no-sandbox'],
  })
  return {
    async teardown() {
      server.close()
      await browser.close()
    },
    async visit(path: string) {
      const page = await browser.newPage()
      const response = await page.goto(`http://localhost:${port}`)
      const html = await page.content()
      return {
        statusCode: response?.status(),
        html,
      }
    },
  }
}
