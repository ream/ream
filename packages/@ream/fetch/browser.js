var fetch = require('unfetch')
var { handleError, FetchError } = require('./shared')

exports.fetch = function (url, opts) {
  return fetch.default(url, opts).then(handleError)
}

exports.FetchError = FetchError
