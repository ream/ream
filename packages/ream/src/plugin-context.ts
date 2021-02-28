import { Ream } from '.'
import { normalizePath } from './utils/normalize-path'

type OnFileChangeCallback = (
  event: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir',
  filepath: string
) => any

type State = {
  constants: {
    [k: string]: string
  }
  pluginsFiles: {
    'enhance-app': Set<string>
    'enhance-server': Set<string>
  }
  hookCallbacks: {
    onPrepareFiles: Set<() => Promise<void>>
    onFileChange: Set<OnFileChangeCallback>
  }
}

export class PluginContext {
  state: State = {
    constants: {},
    pluginsFiles: {
      'enhance-app': new Set(),
      'enhance-server': new Set(),
    },
    hookCallbacks: {
      onPrepareFiles: new Set(),
      onFileChange: new Set(),
    },
  }

  api: Ream

  constructor(api: Ream) {
    this.api = api
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
    this.state.hookCallbacks.onPrepareFiles.add(callback)
  }

  onFileChange(callback: OnFileChangeCallback) {
    this.state.hookCallbacks.onFileChange.add(callback)
  }
}
