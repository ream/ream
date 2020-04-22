import { RequestListener } from 'http'
import resolveFrom from 'resolve-from'
import { createDevMiddlewares } from './dev-middlewares'
import { Ream } from '..'
import * as ReamServerTypes from 'ream-server'

export function createDevServer(api: Ream): RequestListener {
  const clearRequireCache = () => {
    if (api.isDev && require.cache) {
      for (const key of Object.keys(require.cache)) {
        if (
          key.includes('/packages/ream/') ||
          key.includes('/packages/@ream/') ||
          key.startsWith(api.resolveDotReam())
        ) {
          delete require.cache[key]
        }
      }
    }
  }

  const devMiddlewares = createDevMiddlewares(api)

  return (req, res) => {
    clearRequireCache()

    const reamServerPath = resolveFrom.silent(
      api.resolveDotReam(),
      './server/ream-server.js'
    )

    if (!reamServerPath) {
      return res.end(`Wait until bundle finishes..`)
    }

    const { ReamServer }: typeof ReamServerTypes = require(reamServerPath)

    const rs = new ReamServer({
      getRoutes: () => api.routes,
      beforeMiddlewares(server) {
        devMiddlewares.forEach(middleware => {
          server.use(middleware)
        })
      },
    })

    const { handler } = rs.createServer()
    return handler(req, res)
  }
}
