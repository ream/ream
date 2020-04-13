import { useDevMiddlewares } from './use-dev-middlewares'
import { Ream } from '..'
import { createServer } from 'ream-server'

export function createDevServer(api: Ream) {
  const server = createServer(api.resolveRoot(), {
    serveStaticProps: true,
    routes: api.routes,
    beforeMiddlewares(server) {
      useDevMiddlewares(api, server)
      server.use((req, res, next) => {
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
        clearRequireCache()
        next()
      })
    },
  })

  return server
}
