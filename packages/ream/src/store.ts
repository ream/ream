import { normalizePath } from './utils/normalize-path'

type State = {
  constants: {
    [k: string]: string
  }
  pluginsFiles: {
    'enhance-app': Set<string>
    'enhance-server': Set<string>
  }
}

export class Store {
  state: State = {
    constants: {},
    pluginsFiles: {
      'enhance-app': new Set(),
      'enhance-server': new Set(),
    },
  }

  defineConstant = (name: string, value: any) => {
    this.state.constants[name] = JSON.stringify(value)
  }

  addPluginFile = (type: keyof State['pluginsFiles'], file: string) => {
    this.state.pluginsFiles[type].add(normalizePath(file))
  }
}

export const store = new Store()
