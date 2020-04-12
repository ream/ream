import { createServer as createProductionServer } from 'ream-server'
import { Ream } from '../'
import { createDevServer } from './create-dev-server'

export function createServer(api: Ream) {
  const server = api.isDev
    ? createDevServer(api)
    : createProductionServer(api.resolveRoot())

  return server
}
