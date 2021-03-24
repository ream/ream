export type OnFileChangeCallback = (
  event: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir',
  filepath: string
) => any

type CallbackWithPluginName<TCallback> = {
  pluginName: string
  callback: TCallback
}

export type State = {
  constants: {
    [k: string]: string
  }
  pluginsFiles: {
    app: Set<string>
    server: Set<string>
  }
  callbacks: {
    onPrepareFiles: Set<CallbackWithPluginName<() => Promise<void>>>
    onFileChange: Set<CallbackWithPluginName<OnFileChangeCallback>>
  }
}

export const getInitialState = (): State => {
  const state: State = {
    constants: {},
    pluginsFiles: {
      app: new Set(),
      server: new Set(),
    },
    callbacks: {
      onPrepareFiles: new Set(),
      onFileChange: new Set(),
    },
  }

  return state
}
