var fetch = require('unfetch')
var { handleError } = require('./shared')

module.exports = window.fetch = function (url, opts) {
  return fetch.default(url, opts).then(handleError)
}
