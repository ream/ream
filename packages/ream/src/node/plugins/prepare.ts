import path from 'path'
import { ReamPlugin } from '../types'
import glob from 'fast-glob'
import fs from 'fs-extra'
import consola from 'consola'
import { Ream, Route } from '../'
import { filesToRoutes } from '../utils/load-routes'
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
  files: string[] = []
  projectAppHookFiles: string[]
  projectServerHookFiles: string[]

  constructor(private api: Ream) {
    this.projectAppHookFiles = [
      this.api.resolveSrcDir('enhance-app.js'),
      this.api.resolveSrcDir('enhance-app.ts'),
    ]

    this.projectServerHookFiles = [
      this.api.resolveSrcDir('enhance-server.js'),
      this.api.resolveSrcDir('enhance-server.ts'),
    ]
  }

  get pagesDir() {
    return this.api.resolveSrcDir('pages')
  }

  getRelativePathToTemplatesDir(p: string) {
    if (!isAbsolutPath(p)) {
      return p
    }
    return normalizePath(path.relative(this.api.resolveDotReam('templates'), p))
  }

  async writeRoutes() {
    const routesInfo = filesToRoutes(this.files, this.pagesDir)

    const getRoutes = this.api.config.routes
    if (getRoutes) {
      consola.info(`Loading extra routes`)
    }
    const routes = getRoutes
      ? await getRoutes(routesInfo.routes)
      : routesInfo.routes

    const stringifyClientRoutes = (routes: Route[]): string => {
      const clientRoutes = routes.filter((route) => !route.isServerRoute)
      return `[
        ${clientRoutes
          .map((route) => {
            return `{
            path: "${route.path}",
            name: "${route.name}",
            meta: {},
            component: function() {
              return import("${this.getRelativePathToTemplatesDir(route.file)}")
                .then(wrapPage)
            },
            ${
              route.children
                ? `children: ${stringifyClientRoutes(route.children)}`
                : ``
            }
          }`
          })
          .join(',')}${clientRoutes.length === 0 ? '' : ','}
          // Adding a 404 route to suppress vue-router warning
          {
            name: '404',
            path: '/:404(.*)',
            meta:{},
            component: import.meta.env.DEV ? {
              render() {
                return h('h1','error: this component should not be rendered')
              }
            } : {}
          }
      ]`
    }

    const stringifyServerRoutes = (routes: Route[]): string => {
      const serverRoutes = routes.filter((route) => route.isServerRoute)
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

    // Exports that will be used in both server and client code
    const sharedExportsContent = `
    import { h, defineAsyncComponent } from 'vue'
    import { 
      AppComponent as DefaultAppComponent, 
      ErrorComponent as DefaultErrorComponent , 
      NotFoundComponent as DefaultNotFoundComponent } from 'ream/app'
  
    export var ErrorComponent = defineAsyncComponent(function() {
      return ${
        routesInfo.errorFile
          ? `import("${this.getRelativePathToTemplatesDir(
              routesInfo.errorFile
            )}")`
          : `Promise.resolve(DefaultErrorComponent)`
      }
    })
  
    export var AppComponent = defineAsyncComponent(function() {
      return ${
        routesInfo.appFile
          ? `import("${this.getRelativePathToTemplatesDir(
              routesInfo.appFile
            )}")`
          : `Promise.resolve(DefaultAppComponent)`
      }
    })
  
    export var NotFoundComponent = defineAsyncComponent(function() {
      return ${
        routesInfo.notFoundFile
          ? `import("${this.getRelativePathToTemplatesDir(
              routesInfo.notFoundFile
            )}")`
          : `Promise.resolve(DefaultNotFoundComponent)`
      }
    })
  
    var wrapPage = function(page) {
      return {
        name: 'PageWrapper',
        $$load: page.load,
        $$preload: page.preload,
        $$getStaticPaths: page.getStaticPaths,
        $$transition: page.transition,
        setup: function () {
          return function() {
            var Component = page.default
            return h(Component)
          }
        }
      }
    }
  
    var clientRoutes = ${stringifyClientRoutes(routes)}
  
    export {
      clientRoutes,
    }
    `

    writeFileIfChanged(
      this.api.resolveDotReam('templates/shared-exports.js'),
      sharedExportsContent
    )

    const serverExportsContent = `
   export const serverRoutes = ${stringifyServerRoutes(routes)}
    `

    writeFileIfChanged(
      this.api.resolveDotReam('templates/server-exports.js'),
      serverExportsContent
    )
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

      if (!(await fs.pathExists(writer.pagesDir))) {
        throw new Error(`${writer.pagesDir} doesn't exist`)
      }

      const routesFileGlob = '**/*.{vue,ts,tsx,js,jsx}'
      writer.files = await glob(routesFileGlob, {
        cwd: writer.pagesDir,
        onlyFiles: true,
        ignore: ['node_modules', 'dist'],
      })

      await Promise.all([
        writer.writeRoutes(),
        writer.writeHookFile('app'),
        writer.writeHookFile('server'),
        writer.writeGlobalImports(),
        writer.writeIndexHtml(),
      ])
    },

    async onFileChange(type, file) {
      const routesFileRegexp = /\.(vue|ts|tsx|js|jsx)$/

      // Update routes
      if (file.startsWith(writer.pagesDir) && routesFileRegexp.test(file)) {
        const relativePath = path.relative(writer.pagesDir, file)
        if (type === 'add') {
          writer.files.push(relativePath)
          await writer.writeRoutes()
        } else if (type === 'unlink') {
          writer.files.splice(writer.files.indexOf(relativePath), 1)
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
