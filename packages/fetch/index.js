import nodeFetch from 'node-fetch'

const { env } = process

const fetch = function (url, opts) {
  if (url && url[0] === '/') {
    url = `http://localhost:${env.PORT}${url}`
  }
  return nodeFetch(url, opts)
}

global.fetch = fetch
