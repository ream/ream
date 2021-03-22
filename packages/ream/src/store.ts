import { comparePathParserScore, createParser } from '@egoist/router'
import consola from 'consola'
import { normalizePath, Ream, Route } from '.'
import { pathExists, writeFileIfChanged } from './utils/fs'
import { resolveFile } from './utils/resolve-file'
import { makeNestedRoutes, stringifyClientRoutes } from './utils/routes'

export type State = {
  constants: {
    [k: string]: string
  }
  appHandler?: string
  apiHandler?: string
  apiRoutes: Route[]
  pluginsFiles: {
    app: Set<string>
    server: Set<string>
  }
}

export const getInitialState = (): State => {
  const state: State = {
    constants: {},
    appHandler: undefined,
    apiHandler: undefined,
    apiRoutes: [],
    pluginsFiles: {
      app: new Set(),
      server: new Set(),
    },
  }

  return state
}

export class Store {
  state = getInitialState()

  constructor(private api: Ream) {}

  resetState() {
    this.state = getInitialState()
  }

  defineConstant(name: string, value: any) {
    this.state.constants[name] = JSON.stringify(value)
  }

  addPluginFile(type: keyof State['pluginsFiles'], file: string) {
    this.state.pluginsFiles[type].add(normalizePath(file))
  }

  async writeIndexHtml() {
    const filepath = this.api.resolveSrcDir('index.html')
    if (await pathExists(filepath)) return

    consola.info(`Writing ${filepath}`)

    writeFileIfChanged(
      filepath,
      `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ream App</title>
  </head>
  <body>
    <div id="_ream"></div>
    <script type="module" src="/.ream/generated/client-entry.js"></script>
  </body>
</html>
    `
    )
  }

  async writeCommonExports() {
    let clientRoutes: Route[] = []

    for (const plugin of this.api.plugins) {
      if (plugin.plugin.getClientRoutes) {
        const routes = await plugin.plugin.getClientRoutes.call(plugin.context)
        clientRoutes = [...clientRoutes, ...routes]
      }
    }

    if (this.api.config.clientRoutes) {
      clientRoutes = await this.api.config.clientRoutes(clientRoutes)
    }

    const { routes: nestedClientRoutes } = makeNestedRoutes(clientRoutes)

    let content = `
    export var clientRoutes = ${stringifyClientRoutes(
      nestedClientRoutes,
      this.api.resolveDotReam('generated')
    )}
    `
    const filepath = this.api.resolveDotReam('generated/common-exports.js')

    for (const plugin of this.api.plugins) {
      if (plugin.plugin.transformCommonExports) {
        content = await plugin.plugin.transformCommonExports.call(
          plugin.context,
          content
        )
      }
    }

    writeFileIfChanged(filepath, content)
  }

  async writeGlobalImports() {
    writeFileIfChanged(
      this.api.resolveDotReam('generated/global-imports.js'),
      `
      ${this.api.config.imports
        .map((file) => `import ${JSON.stringify(file)}`)
        .join('\n')}
      `
    )
  }

  async writeClientEntry() {
    writeFileIfChanged(
      this.api.resolveDotReam('generated/client-entry.js'),
      `import * as main from '@/main'
      import {clientRoutes} from './common-exports.js'

      const context = {
        initialState: window.INITIAL_STATE,
        routes: clientRoutes, 
        get url() {
          return location.pathname + location.search
        }
      }

      main.default && main.default(context)
      `
    )
  }

  async writeServerExports() {
    let apiRoutes: Route[] = []

    for (const plugin of this.api.plugins) {
      if (plugin.plugin.getApiRoutes) {
        const routes = await plugin.plugin.getApiRoutes.call(plugin.context)
        apiRoutes = [...apiRoutes, ...routes]
      }
    }

    if (this.api.config.apiRoutes) {
      consola.info(`Loading user provided api routes`)
      apiRoutes = await this.api.config.apiRoutes(apiRoutes)
    }

    this.state.apiRoutes = apiRoutes

    let content = `
    export var apiRoutes = [
      ${apiRoutes
        .sort((a, b) => {
          return comparePathParserScore(
            createParser(a.path),
            createParser(b.path)
          )
        })
        .map((route) => {
          return `{
          path: "${route.path}",
          load: () => import("${route.file}")
        }`
        })
        .join(',\n')}
    ]

    import * as enhanceServer from './ream.server.js'
    
    export { enhanceServer }
    `

    const { apiHandler, appHandler } = this.state
    if (apiHandler) {
      content += `
      import apiHandler from '${normalizePath(apiHandler)}'
      export { apiHandler }
      `
    }

    if (appHandler) {
      content += `
      import appHandler from '${normalizePath(appHandler)}'
      export { appHandler }
      `
    }

    content += `
    export const serverRender = async (renderContext) => {
      if (!REAM_SSR_ENABLED) return

      const main = await import('@/main')
      const { clientRoutes } = await import('./common-exports.js') 
      renderContext.routes = clientRoutes
      
      const result = await main.default && main.default(renderContext) 

      return result
    }
    `

    for (const plugin of this.api.plugins) {
      if (plugin.plugin.transformServerExports) {
        content = await plugin.plugin.transformServerExports.call(
          plugin.context,
          content
        )
      }
    }

    writeFileIfChanged(
      this.api.resolveDotReam('generated/server-exports.js'),
      content
    )
  }

  async writeHookFile(type: 'app' | 'server', projectFiles: string[]) {
    const { pluginsFiles } = this.api.store.state
    const files = [...pluginsFiles[type]]

    const projectFile = await resolveFile(projectFiles)

    if (projectFile) {
      files.push(projectFile)
    }

    let content = `
    ${files
      .map((file, index) => {
        return `import * as hook_${type}_${index} from "${file}"`
      })
      .join('\n')}
  
  var files = [
    ${files.map((_, i) => `hook_${type}_${i}`).join(',')}
  ]
  
  function getExportByName(name) {
    var fns = []
    for (var i = 0; i < files.length; i++) {
      var mod = files[i]
      if (mod[name]) {
        fns.push(mod[name])
      }
    }
    return fns
  }
  
  export async function callAsync(name, context) {
    for (const fn of getExportByName(name)) {
      await fn(context)
    }
  }
  `

    if (type === 'server') {
      content += `
    export async function getInitialHTML(context) {
      let html
      for (const fn of getExportByName('getInitialHTML')) {
        const result = fn(context)
        if (result) {
          html = result
        }
      }
      return html
    }
  
    export const hasExport = (name) => getExportByName(name).length > 0
    `
    }

    writeFileIfChanged(
      this.api.resolveDotReam(`generated/ream.${type}.js`),
      content
    )
  }
}
