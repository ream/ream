import { dirname } from 'path'
import resolveFrom from 'resolve-from'
import { ReamPluginConfigItem } from '..'

export function normalizePluginsArray(
  plugins: ReamPluginConfigItem[],
  cwd: string
) {
  return plugins.map(plugin => {
    if (typeof plugin === 'string') {
      const modulePath = resolveFrom(cwd, plugin)
      return { pluginDir: dirname(modulePath), modulePath }
    }
    if (Array.isArray(plugin)) {
      const modulePath = resolveFrom(cwd, plugin[0])
      return {
        pluginDir: dirname(modulePath),
        modulePath,
        options: plugin[1],
      }
    }
    throw new Error(
      `Unsupported plugin type: ${JSON.stringify(plugin, null, 2)}`
    )
  })
}
