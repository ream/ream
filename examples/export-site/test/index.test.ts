import { join } from 'path'
import { buildAndLaunch, ProductionApp } from '@ream/test-utils'
import fs from 'fs'

jest.setTimeout(600000)

describe(`export static site`, () => {
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
    const { statusCode, content } = await app.fetch('/load')
    expect(statusCode).toBe(200)
    expect(content).toContain(`this is a message`)
  })

  it(`should export data as json file`, async () => {
    const { statusCode, content } = await app.fetch('/load.load.json')
    expect(statusCode).toBe(200)
    expect(content).toBe(`{"props":{"msg":"this is a message"},"hasLoad":true}`)
  })
})
