import { createServer as createReamServer } from '@ream/server'
import { createServer as createViteServer } from 'vite'
import type { Ream } from './'
import { getViteConfig } from './vite/get-vite-config'

export const createServer = async (api: Ream) => {
  const viteConfig = getViteConfig(api)
  api.viteDevServer = await createViteServer(viteConfig)

  const server = await createReamServer({
    cwd: api.rootDir,
    loadServerEntry: async () => {
      const serverEntry = await api.viteDevServer!.ssrLoadModule(
        `/@fs/${require.resolve(`@ream/app/server-entry.js`)}`
      )
      return serverEntry.default
    },
    dev: true,
    devMiddleware: api.viteDevServer.middlewares,
    ssrFixStacktrace: (err) => api.viteDevServer!.ssrFixStacktrace(err),
  })

  return server
}
