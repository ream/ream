var fetch = require('node-fetch')
var { handleError, FetchError } = require('./shared')

global.fetch = function (url, opts) {
  if (url && url[0] === '/') {
    url = `http://localhost:${process.env.PORT}${url}`
  }
  return fetch(url, opts)
}

exports.fetch = function (url, opts) {
  return global.fetch(url, opts).then(handleError)
}

exports.FetchError = FetchError
