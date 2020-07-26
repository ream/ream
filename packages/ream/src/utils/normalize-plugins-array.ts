import { dirname, join } from 'path'
import resolveFrom from 'resolve-from'
import { ReamPluginConfigItem } from '../node'
import { ReamPlugin } from '../types'

function requireMain(pluginDir: string): ReamPlugin | null {
  const path = resolveFrom.silent(pluginDir, './index.js')
  return path && require(path)
}

function normalizePlugin(cwd: string, plugin: string, options = {}) {
  const isLocalPlugin = plugin[0] === '.'

  if (isLocalPlugin) {
    const pluginDir = join(cwd, plugin)
    return {
      defaultName: plugin,
      pluginDir,
      options,
      main: requireMain(pluginDir),
    }
  }

  const pkgPath = resolveFrom.silent(cwd, `${plugin}/package.json`)
  if (!pkgPath) {
    throw new Error(`Cannot resolve plugin "${plugin}"`)
  }
  const pluginDir = dirname(pkgPath)

  return {
    defaultName: plugin,
    pluginDir,
    options,
    main: requireMain(pluginDir),
  }
}

export function normalizePluginsArray(
  plugins: ReamPluginConfigItem[],
  cwd: string
) {
  return plugins.map((plugin) => {
    if (typeof plugin === 'string') {
      return normalizePlugin(cwd, plugin)
    }
    if (Array.isArray(plugin)) {
      return normalizePlugin(cwd, plugin[0], plugin[1])
    }
    throw new Error(
      `Unsupported plugin type: ${JSON.stringify(plugin, null, 2)}`
    )
  })
}
