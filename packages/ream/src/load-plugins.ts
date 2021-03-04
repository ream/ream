import path from 'path'
import { loadEnv } from 'vite'
import { Ream } from './'
import { resolveFile } from './utils/resolve-file'

export async function loadPlugins(api: Ream) {
  const { plugins, modules } = api.config

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

  if (modules) {
    for (const modName of modules) {
      const pkgPath = api.localResolve(`${modName}/package.json`)
      if (!pkgPath) {
        throw new Error(`Cannot find module "${modName}" in your project`)
      }
      const modDir = path.dirname(pkgPath)
      const modConfig = require(pkgPath)['ream-module']
      if (!modConfig || !modConfig.name) {
        throw new Error(`Missing "name" in "${modName}"'s module config`)
      }
      if (Array.isArray(modConfig.requiredEnv)) {
        const userEnv = loadEnv(
          api.isDev ? 'development' : 'production',
          api.rootDir
        )
        for (const envName of modConfig.requiredEnv) {
          if (!(envName in api.config.env) && !(envName in userEnv)) {
            throw new Error(
              `Module "${modName}" requires the environment variable "${envName}" to be set!`
            )
          }
        }
      }
      const enhanceAppFile = await resolveFile(
        ['enhance-app.js', 'enhance-app.ts'],
        modDir
      )
      if (enhanceAppFile) {
        api.pluginContext.addPluginFile('enhance-app', enhanceAppFile)
      }
    }
  }
}
