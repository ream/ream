import { createServer } from 'vite'
import { Ream } from '../node'
import { getViteConfig } from '../vite/get-vite-config'

export const createDevMiddleware = async (api: Ream) => {
  const viteConfig = getViteConfig(api)
  console.dir(viteConfig, { depth: 1000 })
  const server = await createServer(viteConfig)
  api.viteDevServer = server
  return server.middlewares
}
