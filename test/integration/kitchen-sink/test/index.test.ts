import { join } from 'path'
import { buildAndLaunch, ProductionApp } from '@ream/test-utils'

jest.setTimeout(600000)

describe(`features`, () => {
  describe(`Production mode`, () => {
    let app: ProductionApp

    beforeAll(async () => {
      const appDir = join(__dirname, '../')
      app = await buildAndLaunch({ appDir, dev: false })
    })

    afterAll(async (done) => {
      if (app) {
        await app.teardown()
      }
      done()
    })

    it(`should render custom 404 page`, async () => {
      const { statusCode, content } = await app.visit('/non-existent-page')
      expect(statusCode).toBe(404)
      expect(content).toContain(`Custom 404 page`)
    })

    it(`should render preload`, async () => {
      const { statusCode, content } = await app.visit('/preload')
      expect(statusCode).toBe(200)
      expect(content).toContain(`hello world`)
    })
  })
})
