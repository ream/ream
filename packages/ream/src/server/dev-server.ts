import type { IncomingMessage, ServerResponse } from 'http'
import { createHandler } from './'
import { ModuleNode } from 'vite'
import type { Ream } from '../'

const collectCssUrls = (mods: Set<ModuleNode>, styles: Map<string, string>) => {
  for (const mod of mods) {
    if (mod.ssrModule && mod.file && mod.id) {
      if (mod.file.endsWith('.css') || /\?vue&type=style/.test(mod.id)) {
        styles.set(mod.url, mod.ssrModule.default)
      }
    }
    if (mod.importedModules.size > 0) {
      collectCssUrls(mod.importedModules, styles)
    }
  }
}

export const getRequestHandler = async (api: Ream) => {
  const viteServer = api.viteServer!

  return async (req: IncomingMessage, res: ServerResponse) => {
    const { handler } = await createHandler({
      cwd: api.rootDir,
      dev: true,
      devMiddleware: viteServer.middlewares,
      viteServer: viteServer,
      fixStacktrace: (err) => viteServer.ssrFixStacktrace(err),
    })

    return handler(req, res)
  }
}
