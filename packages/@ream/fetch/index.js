import _fetch from 'node-fetch'
import { handleError, FetchError } from './shared'

global.fetch = function (url, opts) {
  if (url && url[0] === '/') {
    url = `http://localhost:${process.env.PORT}${url}`
  }
  return _fetch(url, opts)
}

export const fetch = function (url, opts) {
  return global._fetch(url, opts).then(handleError)
}

export { FetchError }
