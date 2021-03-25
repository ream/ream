import { join } from 'path'
import { buildAndLaunch, ProductionApp } from '@ream/test-utils'

jest.setTimeout(600000)

describe(`export static site`, () => {
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

  it(`should export page`, async () => {
    const { statusCode, content } = await app.fetch('/load')
    expect(statusCode).toBe(200)
    expect(content).toContain(`static preload`)
  })

  it(`should export data as json file`, async () => {
    const { statusCode, content } = await app.fetch('/load.load.json')
    expect(statusCode).toBe(200)
    expect(content).toBe(`{"props":{"msg":"static preload"},"hasLoad":true}`)
  })
})
