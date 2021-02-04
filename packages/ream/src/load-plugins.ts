import { Ream } from './node'
import { resolveFiles } from './utils/resolve-files'
import { store } from './store'

export async function loadPlugins(api: Ream) {
  const plugins = api.plugins

  for (const plugin of plugins) {
    const { main, defaultName } = plugin
    const apply = main?.apply
    const config = main?.config || {}
    const pluginName = config.name || defaultName
    const enhanceAppPath = await resolveFiles(
      ['enhance-app.js', 'enhance-app.ts'],
      plugin.pluginDir
    )
    if (enhanceAppPath) {
      store.addPluginFile('enhance-app', enhanceAppPath)
    }
    if (apply) {
      try {
        apply(store, plugin.options || {})
      } catch (error) {
        error.message = `Failed to load plugin "${pluginName}", ${error.message}`
        throw error
      }
    }
  }
}
