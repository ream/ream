import { join } from 'path'
import { buildAndLaunch, ProductionApp } from '@ream/test-utils'

jest.setTimeout(600000)

describe(`use preload`, () => {
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

    it(`should render preload`, async () => {
      const { statusCode, html } = await app.visit('/')
      expect(statusCode).toBe(200)
      expect(html).toContain(`hello world`)
    })
  })
})
