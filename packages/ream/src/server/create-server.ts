import { Ream } from '../'
import { Server } from './server'

export async function getRequestHandler(api: Ream) {
  const server = new Server()

  if (api.isDev) {
    const { createDevMiddlewares } = await import('./dev-middlewares')
    const devMiddlewares = createDevMiddlewares(api)
    for (const m of devMiddlewares) {
      server.use(m)
    }
  }

  server.use((req, res) => {
    if (req.method !== 'GET') {
      return res.end('unsupported metho')
    }
    res.end('123')
  })

  return server.handler
}
