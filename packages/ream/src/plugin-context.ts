import { Ream } from '.'

export class PluginContext {
  pluginName: string

  constructor(private api: Ream, pluginName: string) {
    this.pluginName = pluginName
  }

  get store() {
    return this.api.store
  }

  get env() {
    return this.api.env
  }

  get constants() {
    return this.api.constants
  }

  get config() {
    return this.api.config
  }

  ensureEnv(name: string, defaultValue?: string) {
    const value = this.env[name]
    if (!value && !defaultValue) {
      throw new Error(
        `Plugin "${this.pluginName}" requires environment variable "${name}" to be set.`
      )
    }
    return value || defaultValue
  }

  resolveSrcDir(...args: string[]) {
    return this.api.resolveSrcDir(...args)
  }

  resolveRootDir(...args: string[]) {
    return this.api.resolveRootDir(...args)
  }

  resolveDotReam(...args: string[]) {
    return this.api.resolveDotReam(...args)
  }
}
