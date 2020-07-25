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

    it(`should export static page`, async () => {
      const { statusCode, content } = await app.visit('/')
      expect(statusCode).toBe(200)
      expect(content).toContain(`home`)
    })

    it(`should export server route`, async () => {
      const { statusCode, content } = await app.visit('/server-route.json')
      expect(statusCode).toBe(200)
      expect(content).toBe(`{"message":"hello world"}`)
    })

    it(`should export serverpreload.json`, async () => {
      const { statusCode, content } = await app.visit(
        '/server-preload.serverpreload.json'
      )
      expect(statusCode).toBe(200)
      expect(content).toBe(`{"message":"server preload"}`)
    })
  })
})
