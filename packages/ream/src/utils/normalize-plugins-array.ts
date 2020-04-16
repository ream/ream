import { dirname } from 'path'
import resolveFrom from 'resolve-from'
import { ReamPluginConfigItem } from '..'

export function normalizePluginsArray(
  plugins: ReamPluginConfigItem[],
  cwd: string
) {
  return plugins.map(plugin => {
    if (typeof plugin === 'string') {
      const pkgPath = resolveFrom(cwd, `${plugin}/package.json`)
      return { pluginDir: dirname(pkgPath), pkgPath }
    }
    if (Array.isArray(plugin)) {
      const pkgPath = resolveFrom(cwd, `${plugin[0]}/package.json`)
      return {
        pluginDir: dirname(pkgPath),
        pkgPath,
        options: plugin[1],
      }
    }
    throw new Error(
      `Unsupported plugin type: ${JSON.stringify(plugin, null, 2)}`
    )
  })
}
