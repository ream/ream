import { join } from 'path'
import { buildAndLaunch, ProductionApp } from '@ream/test-utils'

jest.setTimeout(600000)

describe(`Custom 404 page`, () => {
  describe(`Production mode`, () => {
    let app: ProductionApp

    beforeAll(async () => {
      const appDir = join(__dirname, '../')
      app = await buildAndLaunch({ appDir, dev: false })
    })

    afterAll(async done => {
      await app.teardown()
      done()
    })

    it(`should render custom 404 page`, async () => {
      const { statusCode, html } = await app.visit('/')
      expect(statusCode).toBe(404)
      expect(html).toContain(`Custom 404 page`)
      // The prop that's used to inform client app that this page is 404 page
      expect(html).toContain(`pageProps: {__404__:true}`)
    })
  })
})
