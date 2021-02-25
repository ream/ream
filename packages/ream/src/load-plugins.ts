import { Ream } from './'
import { store } from './store'

export async function loadPlugins(api: Ream) {
  const plugins = api.config.plugins

  for (const plugin of plugins) {
    const { name, apply } = plugin
    if (apply) {
      try {
        apply(store)
      } catch (error) {
        error.message = `Failed to load plugin "${name}", ${error.message}`
        throw error
      }
    }
  }
}
