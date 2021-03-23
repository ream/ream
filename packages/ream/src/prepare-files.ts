import { Ream } from './'

export async function prepareFiles(api: Ream) {
  const projectAppHookFiles = [
    api.resolveSrcDir('ream-app.js'),
    api.resolveSrcDir('ream-app.ts'),
  ]

  const projectServerHookFiles = [
    api.resolveSrcDir('ream-server.js'),
    api.resolveSrcDir('ream-server.ts'),
  ]

  await Promise.all([
    api.store.writeIndexHtml(),
    api.store.writeHookFile('app', projectAppHookFiles),
    api.store.writeHookFile('server', projectServerHookFiles),
    api.store.writeGlobalImports(),
    api.store.writeServerExports(),
    api.store.writeCommonExports(),
    api.store.writeClientEntry(),
  ])

  if (api.viteServer) {
    api.viteServer.watcher.on('all', async (_, file) => {
      // Update enhanceApp
      if (projectAppHookFiles.includes(file)) {
        await api.store.writeHookFile('app', projectAppHookFiles)
      }
      if (projectServerHookFiles.includes(file)) {
        await api.store.writeHookFile('server', projectServerHookFiles)
      }
    })
  }
}
