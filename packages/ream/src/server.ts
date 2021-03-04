import { createServer as createReamServer } from '@ream/server'
import { createServer as createViteServer, ModuleNode } from 'vite'
import type { Ream } from './'
import { getViteConfig } from './vite/get-vite-config'

const SERVER_ENTRY_PATH = require.resolve(`@ream/app/server-entry.js`)

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

export const createServer = async (api: Ream) => {
  const viteConfig = getViteConfig(api)
  const viteDevServer = await createViteServer(viteConfig)
  api.viteDevServer = viteDevServer

  for (const callback of api.pluginContext.hookCallbacks.onFileChange) {
    viteDevServer.watcher.on('all', callback)
  }

  const server = createReamServer({
    cwd: api.rootDir,
    context: async () => {
      // waiting to vite to finish reloading devDependencies
      // @ts-expect-error
      await viteDevServer._pendingReload
      const serverEntry = await viteDevServer.ssrLoadModule(
        `/@fs/${SERVER_ENTRY_PATH}`
      )
      return {
        serverEntry: serverEntry.default,
      }
    },
    getHtmlAssets: () => {
      const matchedMods = viteDevServer.moduleGraph.getModulesByFile(
        SERVER_ENTRY_PATH
      )
      const styles: Map<string, string> = new Map()
      if (matchedMods) {
        collectCssUrls(matchedMods, styles)
      }
      return {
        cssLinkTags: [...styles.values()]
          .map((style) => `<style>${style}</style>`)
          .join('\n'),
        scriptTags: `<script type="module" src="/@vite/client"></script>
        <script type="module" src="/@fs/${require.resolve(
          `@ream/app/client-entry.js`
        )}"></script>
        `,
      }
    },
    dev: true,
    devMiddleware: api.viteDevServer.middlewares,
    ssrFixStacktrace: (err) => api.viteDevServer!.ssrFixStacktrace(err),
  })

  return server
}
