import { join } from 'path'
import { buildAndLaunch, ProductionApp } from '@ream/test-utils'

jest.setTimeout(600000)

describe(`export static site`, () => {
  describe(`Production mode`, () => {
    let app: ProductionApp

    beforeAll(async () => {
      const appDir = join(__dirname, '../')
      app = await buildAndLaunch({ appDir, dev: false, export: true })
    })

    afterAll(async (done) => {
      if (app) {
        await app.teardown()
      }
      done()
    })

    it(`should export page`, async () => {
      const { statusCode, content } = await app.visit('/static-preload')
      expect(statusCode).toBe(200)
      expect(content).toContain(`static preload`)
    })

    it(`should export data as json file`, async () => {
      const { statusCode, content } = await app.visit(
        '/static-preload.serverpreload.json'
      )
      expect(statusCode).toBe(200)
      expect(content).toBe(`{"message":"static preload"}`)
    })
  })
})
