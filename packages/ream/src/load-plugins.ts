import { Ream } from './'

export async function loadPlugins(api: Ream) {
  const plugins = api.config.plugins

  for (const plugin of plugins) {
    const { name, apply } = plugin
    if (apply) {
      try {
        apply(api.pluginContext)
      } catch (error) {
        error.message = `Failed to load plugin "${name}", ${error.message}`
        throw error
      }
    }
  }
}
