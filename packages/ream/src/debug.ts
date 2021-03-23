import createDebug from 'debug'

export const debug = {
  request: createDebug('ream:request'),
  server: createDebug('ream:server'),
}
