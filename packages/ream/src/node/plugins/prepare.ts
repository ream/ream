import path from 'path'
import { ReamPlugin } from '../types'
import fs from 'fs-extra'
import consola from 'consola'
import { Endpoint, Ream, Route } from '../'
import {
  createRoutesLoader,
  RoutesInfo,
  RoutesLoader,
} from '../utils/load-routes'
import { normalizePath } from '../utils/normalize-path'
import { resolveFile } from '../utils/resolve-file'

const isAbsolutPath = (p: string) => /^\/|[a-zA-Z]:/.test(p)

const writeFileIfChanged = (filepath: string, content: string) => {
  if (fs.pathExistsSync(filepath)) {
    const prev = fs.readFileSync(filepath, 'utf8')
    if (prev === content) return
  }

  fs.outputFileSync(filepath, content, 'utf8')
}

class FileWriter {
  projectAppHookFiles: string[]
  projectServerHookFiles: string[]
  routesLoader: RoutesLoader
  routesInfo: RoutesInfo
  pages: Route[] = []
  endpoints: Endpoint[] = []

  constructor(private api: Ream) {
    this.projectAppHookFiles = [
      this.api.resolveSrcDir('enhance-app.js'),
      this.api.resolveSrcDir('enhance-app.ts'),
    ]

    this.projectServerHookFiles = [
      this.api.resolveSrcDir('enhance-server.js'),
      this.api.resolveSrcDir('enhance-server.ts'),
    ]

    this.routesLoader = createRoutesLoader(this.routesDir)
    this.routesInfo = { endpoints: [], pages: [] }
  }

  get routesDir() {
    return this.api.resolveSrcDir('routes')
  }

  getRelativePathToTemplatesDir(p: string) {
    if (!isAbsolutPath(p)) {
      return p
    }
    return normalizePath(path.relative(this.api.resolveDotReam('templates'), p))
  }

  async updateRoutesInfo() {
    this.routesInfo = this.routesLoader.load()
    this.pages = this.routesInfo.pages
    this.endpoints = this.routesInfo.endpoints

    const extendPages = this.api.config.pages
    const extendPagesFns = [
      ...this.api.config.plugins.map((plugin) => plugin.pages),
      ...(extendPages ? [extendPages] : []),
    ].filter(Boolean)
    if (extendPagesFns.length > 0) {
      consola.info(`Loading extra pages`)
      for (const fn of extendPagesFns) {
        if (fn) {
          this.pages = await fn.call(this.api, this.pages)
        }
      }
    }

    const extendEndpoints = this.api.config.endpoints
    const extendEndpointsFns = [
      ...this.api.config.plugins.map((plugin) => plugin.endpoints),
      ...(extendEndpoints ? [extendEndpoints] : []),
    ].filter(Boolean)
    if (extendEndpointsFns.length > 0) {
      consola.info(`Loading extra endpoints`)
      for (const fn of extendEndpointsFns) {
        if (fn) {
          this.endpoints = await fn.call(this.api, this.endpoints)
        }
      }
    }
  }

  async writeClientRoutes() {
    const stringifyPages = (pages: Route[]): string => {
      return `[
          ${pages
            .map((page) => {
              return `{
              path: "${page.path}",
              name: "${page.name}",
              meta: {},
              component: function() {
                return import("${this.getRelativePathToTemplatesDir(
                  page.file
                )}")
                  .then(wrapPage)
              },
              ${
                page.children && page.children.length > 0
                  ? `children: ${stringifyPages(page.children)}`
                  : ``
              }
            }`
            })
            .join(',')}
        ]`
    }
    const clientRoutesContent = `
      import { h, defineAsyncComponent } from 'vue'
      import { 
        ErrorComponent as DefaultErrorComponent , 
        NotFoundComponent as DefaultNotFoundComponent } from 'ream/app'
    
      export var ErrorComponent = defineAsyncComponent(function() {
        return ${
          this.routesInfo.errorFile
            ? `import("${this.getRelativePathToTemplatesDir(
                this.routesInfo.errorFile
              )}")`
            : `Promise.resolve(DefaultErrorComponent)`
        }
      })
    
      export var NotFoundComponent = defineAsyncComponent(function() {
        return ${
          this.routesInfo.notFoundFile
            ? `import("${this.getRelativePathToTemplatesDir(
                this.routesInfo.notFoundFile
              )}")`
            : `Promise.resolve(DefaultNotFoundComponent)`
        }
      })
    
      var wrapPage = function(page) {
        var Component = page.default
        return {
          ...Component,
          $$load: page.load,
          $$preload: page.preload,
          $$getStaticPaths: page.getStaticPaths,
          $$transition: page.transition,
        }
      }
    
      var clientRoutes = ${stringifyPages(this.pages)}
  
      clientRoutes.push({
        name: '404',
        path: '/:404(.*)',
        meta:{},
        component: import.meta.env.DEV ? {
          render() {
            return h('h1','error: this component should not be rendered')
          }
        } : {}
      })
    
      export {
        clientRoutes,
      }
      `

    writeFileIfChanged(
      this.api.resolveDotReam('templates/client-routes.js'),
      clientRoutesContent
    )
  }

  async writeServerRoutes() {
    const stringifyEndpoints = (routes: Route[]): string => {
      const serverRoutes = routes.filter((route) => route.isEndpoint)
      return `[
          ${serverRoutes
            .map((route) => {
              return `{
              path: "${route.path}",
              meta: {load: () => import("${this.getRelativePathToTemplatesDir(
                route.file
              )}")},
              component: {}
            }`
            })
            .join(',')}${serverRoutes.length === 0 ? '' : ','}
            {
              name: '404',
              path: '/:404(.*)',
              component: {}
            }
        ]`
    }
    const serverRoutesContent = `
    export const serverRoutes = ${stringifyEndpoints(this.endpoints)}
     `

    writeFileIfChanged(
      this.api.resolveDotReam('templates/server-routes.js'),
      serverRoutesContent
    )
  }

  async writeRoutes() {
    await this.updateRoutesInfo()
    await Promise.all([this.writeClientRoutes(), this.writeServerRoutes()])
  }

  async writeGlobalImports() {
    writeFileIfChanged(
      this.api.resolveDotReam('templates/global-imports.js'),
      `
      ${this.api.config.imports
        .map((file) => `import ${JSON.stringify(file)}`)
        .join('\n')}
      `
    )
  }

  async writeIndexHtml() {
    const filepath = this.api.resolveSrcDir('index.html')
    if (await fs.pathExists(filepath)) return

    const content = `<!DOCTYPE html>
<html ream-html-attrs>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--ream-head-->
</head>
<body ream-body-attrs>
  <!--ream-main-->
</body>
</html>`

    await fs.outputFile(filepath, content, 'utf8')
  }

  async writeHookFile(type: 'app' | 'server') {
    let files: string[] = []

    for (const plugin of this.api.config.plugins) {
      if (type === 'app') {
        if (plugin.enhanceAppFiles) {
          files = [...files, ...plugin.enhanceAppFiles.call(this.api)]
        }
      } else if (type === 'server') {
        if (plugin.enhanceServerFiles) {
          files = [...files, ...plugin.enhanceServerFiles.call(this.api)]
        }
      }
    }

    const projectFile = await resolveFile(
      type === 'app' ? this.projectAppHookFiles : this.projectServerHookFiles
    )

    if (projectFile) {
      files.push(projectFile)
    }

    let content = `
    ${files
      .map((file, index) => {
        return `import * as hook_${type}_${index} from "${this.getRelativePathToTemplatesDir(
          file
        )}"`
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
    export const hasExport = (name) => getExportByName(name).length > 0
    `
    }

    writeFileIfChanged(
      this.api.resolveDotReam(`templates/enhance-${type}.js`),
      content
    )
  }
}

export const preparePlugin = (): ReamPlugin => {
  let writer: FileWriter

  return {
    name: `ream:prepare`,

    async prepare() {
      writer = new FileWriter(this)

      if (!(await fs.pathExists(writer.routesDir))) {
        throw new Error(`${writer.routesDir} doesn't exist`)
      }

      await Promise.all([
        writer.writeRoutes(),
        writer.writeHookFile('app'),
        writer.writeHookFile('server'),
        writer.writeGlobalImports(),
        writer.writeIndexHtml(),
      ])
    },

    async onFileChange(type, file) {
      // Update routes
      if (
        file.startsWith(writer.routesDir) &&
        writer.routesLoader.extRe.test(file)
      ) {
        if (type === 'add' || type === 'unlink') {
          await writer.writeRoutes()
        }
      }

      // Update enhanceApp
      if (writer.projectAppHookFiles.includes(file)) {
        await writer.writeHookFile('app')
      }
      if (writer.projectServerHookFiles.includes(file)) {
        await writer.writeHookFile('server')
      }
    },
  }
}
