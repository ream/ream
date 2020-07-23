const fetch = require('node-fetch')

module.exports = global.fetch = function (url, opts) {
  if (url[0] === '/') {
    return fetch(`http://localhost:${process.env.PORT}${url}`, opts)
  }
  return fetch(url, opts)
}
