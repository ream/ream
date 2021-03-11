import { Ream } from '.'
import { OnFileChangeCallback, State } from './state'
import { normalizePath } from './utils/normalize-path'

export class PluginContext {
  private api: Ream
  pluginName: string

  constructor(api: Ream, pluginName: string) {
    this.api = api
    this.pluginName = pluginName
  }

  get state() {
    return this.api.state
  }

  get env() {
    return { ...this.api.userEnv, ...this.api.config.env }
  }

  get constants(): Record<string, string> {
    const { env } = this
    return {
      ...this.state.constants,
      ...Object.keys(env).reduce((res, key) => {
        const value = JSON.stringify(env[key])
        return {
          ...res,
          [`import.meta.env.${key}`]: value,
          [`process.env.${key}`]: value,
        }
      }, {}),
    }
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

  get pluginsFiles() {
    return this.state.pluginsFiles
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

  defineConstant(name: string, value: any) {
    this.state.constants[name] = JSON.stringify(value)
  }

  addPluginFile(type: keyof State['pluginsFiles'], file: string) {
    this.state.pluginsFiles[type].add(normalizePath(file))
  }

  onPrepareFiles(callback: () => Promise<void>) {
    this.state.callbacks.onPrepareFiles.add({
      pluginName: this.pluginName,
      callback,
    })
  }

  onFileChange(callback: OnFileChangeCallback) {
    this.state.callbacks.onFileChange.add({
      pluginName: this.pluginName,
      callback,
    })
  }
}
