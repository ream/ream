const fetch = require('node-fetch')
var { handleError } = require('./shared')

module.exports = global.fetch = function (url, opts) {
  if (url && url[0] === '/') {
    url = `http://localhost:${process.env.PORT}${url}`
  }
  return fetch(url, opts).then(handleError)
}
