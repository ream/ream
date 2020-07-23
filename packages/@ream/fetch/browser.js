var fetch = require('unfetch')

module.exports = window.fetch = function (url, opts) {
  return fetch(url, opts)
}
