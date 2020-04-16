import { Ream } from '.'
import { resolveFiles } from './utils/resolve-files'
import { store } from './store'

type PluginConfig = {
  name: string
}

export async function loadPlugins(api: Ream) {
  const plugins = api.plugins

  for (const plugin of plugins) {
    const main = require(plugin.modulePath)
    const config: PluginConfig = main.config
    if (!config) {
      throw new Error(
        `${plugin.pluginDir} is not a Ream plugin, maybe you forgot to add exports.config in your plugin entry`
      )
    }
    const enhanceAppPath = await resolveFiles(
      ['enhance-app.js', 'enhance-app.ts'],
      plugin.pluginDir
    )
    if (enhanceAppPath) {
      store.addPluginFile('enhance-app', enhanceAppPath)
    }
    const chainWebpackPath = await resolveFiles(
      ['chain-webpack.js'],
      plugin.pluginDir
    )
    if (chainWebpackPath) {
      store.addPluginFile('chain-webpack', chainWebpackPath)
    }
    try {
      main.apply(store, plugin.options || {})
    } catch (error) {
      error.message = `Failed to load plugin "${config.name}", ${error.message}`
      throw error
    }
  }
}
