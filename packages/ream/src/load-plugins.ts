import { Ream } from './'
import { PluginContext } from './plugin-context'

export async function loadPlugins(api: Ream) {
  const { plugins } = api.config

  for (const plugin of plugins) {
    const { name, apply } = plugin
    if (apply) {
      const context = new PluginContext(api, name)
      try {
        apply(context)
      } catch (error) {
        error.message = `Failed to load plugin "${name}", ${error.message}`
        throw error
      }
    }
  }
}
