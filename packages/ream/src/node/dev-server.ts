import fs from 'fs'
import { IncomingMessage, ServerResponse } from 'http'
import { createHandler, ServerEntry } from './server'
import { ModuleNode } from 'vite'
import { Ream, resolveOwnDir } from './'

const SERVER_ENTRY_PATH = resolveOwnDir(`app/server-entry.js`)

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
  const viteDevServer = api.viteDevServer!

  return async (req: IncomingMessage, res: ServerResponse) => {
    // waiting to vite to finish reloading devDependencies
    // @ts-expect-error
    await viteDevServer._pendingReload

    const serverEntry = (await viteDevServer.ssrLoadModule(
      `/@fs/${SERVER_ENTRY_PATH}`
    )) as ServerEntry

    const matchedMods = viteDevServer.moduleGraph.getModulesByFile(
      SERVER_ENTRY_PATH
    )
    const styles: Map<string, string> = new Map()
    if (matchedMods) {
      collectCssUrls(matchedMods, styles)
    }
    const inlineStyles = [...styles.values()]
      .map((style) => `<style>${style}</style>`)
      .join('\n')

    let htmlTemplate = await fs.promises.readFile(
      api.resolveSrcDir('index.html'),
      'utf8'
    )
    htmlTemplate = htmlTemplate.replace('<!--ream-head-->', `$&${inlineStyles}`)
    htmlTemplate = await viteDevServer.transformIndexHtml(
      req.url!,
      htmlTemplate
    )

    const handler = await createHandler({
      cwd: api.rootDir,
      serverEntry: serverEntry!,
      htmlTemplate: htmlTemplate!,
      dev: true,
      before(server) {
        server.use(viteDevServer.middlewares)
      },
      fixStacktrace: (err) => viteDevServer.ssrFixStacktrace(err),
    })

    return handler(req, res)
  }
}
