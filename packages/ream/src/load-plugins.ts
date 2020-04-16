import { Ream } from '.'
import { resolveFiles } from './utils/resolve-files'

type PluginConfig = {
  name: string
  'default-env'?: {
    [name: string]: any
  }
  'required-env'?: string[]
}

export async function loadPlugins(api: Ream) {
  const plugins = api.plugins

  for (const plugin of plugins) {
    const pkg = require(plugin.pkgPath)
    const config: PluginConfig = pkg['ream-plugin']
    if (!config) {
      throw new Error(
        `${plugin.pluginDir} is not a Ream plugin, maybe you forgot to define "ream-plugin" key in its package.json`
      )
    }
    if (config['default-env']) {
      api.config.env = Object.assign({}, config['default-env'], api.config.env)
    }
    if (config['required-env']) {
      for (const name of config['required-env']) {
        if (api.config.env[name] === undefined) {
          throw new Error(
            `Plugin "${config.name}" requires an environment variable "${name}", please define it in ream.config.js`
          )
        }
      }
    }
    const enhanceAppPath = await resolveFiles(
      ['src/enhance-app.js', 'src/enhance-app.ts'],
      plugin.pluginDir
    )
    if (enhanceAppPath) {
      api.enhanceApp.addFile(enhanceAppPath)
    }
  }
}
