import { createServer as _createServer } from '@ream/server'
import { createServer as createViteServer } from 'vite'
import type { Ream } from './node'
import { getViteConfig } from './vite/get-vite-config'

export const createServer = async (api: Ream) => {
  const viteConfig = getViteConfig(api)
  api.viteDevServer = await createViteServer(viteConfig)

  const server = await _createServer({
    cwd: api.rootDir,
    loadServerEntry: async () => {
      const serverEntry = await api.viteDevServer!.ssrLoadModule(
        `@ream/vue-app/server-entry.js`
      )
      return serverEntry.default
    },
    dev: true,
    devMiddleware: api.viteDevServer.middlewares,
    ssrFixStacktrace: (err) => api.viteDevServer!.ssrFixStacktrace(err),
  })

  return server
}
