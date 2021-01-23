import _fetch from 'unfetch'
import { handleError, FetchError } from './shared'

export const fetch = function (url, opts) {
  return _fetch(url, opts).then(handleError)
}

export { FetchError }
