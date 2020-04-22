import * as ReamServerTypes from 'ream-server'
import { Ream } from '../'

export async function getRequestHandler(api: Ream) {
  if (api.isDev) {
    const { createDevServer } = await import('./create-dev-server')
    return createDevServer(api)
  }

  const { ReamServer }: typeof ReamServerTypes = require(api.resolveDotReam(
    'server/ream-server.js'
  ))
  const rs = new ReamServer()
  return rs.createServer().handler
}
