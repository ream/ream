import * as ReamServer from 'ream-server'
import { Ream } from '../'

export async function createServer(api: Ream) {
  if (api.isDev) {
    const { createDevServer } = await import('./create-dev-server')
    return createDevServer(api)
  }

  const reamServer: typeof ReamServer = require(api.resolveDotReam(
    'server/ream-server.js'
  ))

  return reamServer.createServer()
}
