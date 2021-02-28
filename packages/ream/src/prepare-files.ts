import glob from 'fast-glob'
import { outputFile, pathExists, readFile } from 'fs-extra'
import { Ream } from './'
import { Route } from './utils/route'
import path from 'path'
import { filesToRoutes } from './utils/load-routes'
import { normalizePath } from './utils/normalize-path'
import { resolveFile } from './utils/resolve-file'

const isAbsolutPath = (p: string) => /^\/|[a-zA-Z]:/.test(p)

const writeFileIfChanged = async (filepath: string, content: string) => {
  if (await pathExists(filepath)) {
    const prev = await readFile(filepath, 'utf8')
    if (prev === content) return
  }

  await outputFile(filepath, content, 'utf8')
}

const writeEnhanceApp = async (api: Ream, projectEnhanceAppFiles: string[]) => {
  const { pluginsFiles } = api.pluginContext.state
  const enhanceAppFiles = [...pluginsFiles['enhance-app']]

  const projectEnhanceAppFile = await resolveFile(projectEnhanceAppFiles)

  if (projectEnhanceAppFile) {
    enhanceAppFiles.push(projectEnhanceAppFile)
  }

  await writeFileIfChanged(
    api.resolveDotReam('templates/enhance-app.js'),
    `
    ${enhanceAppFiles
      .map((file, index) => {
        return `import * as enhanceApp_${index} from "${file}"`
      })
      .join('\n')}

  var files = [
    ${enhanceAppFiles.map((_, i) => `enhanceApp_${i}`).join(',')}
  ]

  var exec = function(name, context) {
    for (var i = 0; i < files.length; i++) {
      var mod = files[i]
      if (mod[name]) {
        mod[name](context)
      }
    }
  }

  export function onCreatedApp(context) {
    exec('onCreatedApp', context)
  }
  `
  )
}

export async function prepareFiles(api: Ream) {
  const pagesDir = api.resolveSrcDir('pages')
  const routesFileGlob = '**/*.{vue,ts,tsx,js,jsx}'
  const routesFileRegexp = /\.(vue|ts|tsx|js|jsx)$/

  if (!(await pathExists(pagesDir))) {
    throw new Error(`${pagesDir} doesn't exist`)
  }

  const files = await glob(routesFileGlob, {
    cwd: pagesDir,
    onlyFiles: true,
    ignore: ['node_modules', 'dist'],
  })

  const projectEnhanceAppFiles = [
    api.resolveSrcDir('enhance-app.js'),
    api.resolveSrcDir('enhance-app.ts'),
  ]

  const writeRoutes = async () => {
    const routesInfo = filesToRoutes(files, pagesDir)

    const getRelativePathToTemplatesDir = (p: string) => {
      if (!isAbsolutPath(p)) {
        return p
      }
      return normalizePath(path.relative(api.resolveDotReam('templates'), p))
    }

    const stringifyClientRoutes = (routes: Route[]): string => {
      const clientRoutes = routes.filter((route) => !route.isServerRoute)
      return `[
        ${clientRoutes
          .map((route) => {
            return `{
            path: "${route.path}",
            ${route.routeName ? `name: "${route.routeName}",` : ``}
            component: function() {
              return import("${getRelativePathToTemplatesDir(route.file)}")
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
            meta: {load: () => import("${getRelativePathToTemplatesDir(
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

    var ErrorComponent = defineAsyncComponent(function() {
      return import("${getRelativePathToTemplatesDir(routesInfo.errorFile)}")
    })

    var AppComponent = defineAsyncComponent(function() {
      return import("${getRelativePathToTemplatesDir(routesInfo.appFile)}")
    })

    var NotFoundComponent = defineAsyncComponent(function() {
      return import("${getRelativePathToTemplatesDir(routesInfo.notFoundFile)}")
    })

    var wrapPage = function(page) {
      return {
        name: 'PageWrapper',
        $$preload: page.preload,
        $$staticPreload: page.staticPreload,
        $$getStaticPaths: page.getStaticPaths,
        setup: function () {
          return function() {
            var Component = page.default
            return h(Component)
          }
        }
      }
    }

    var clientRoutes = ${stringifyClientRoutes(routesInfo.routes)}

    export {
      clientRoutes,
      ErrorComponent,
      AppComponent,
      NotFoundComponent
    }
    `

    await writeFileIfChanged(
      api.resolveDotReam('templates/shared-exports.js'),
      sharedExportsContent
    )

    const serverExportsContent = `
   export const serverRoutes = ${stringifyServerRoutes(routesInfo.routes)}

   export const _document = () => import("${routesInfo.documentFile}")
    `

    await writeFileIfChanged(
      api.resolveDotReam('templates/server-exports.js'),
      serverExportsContent
    )
  }

  const writeGlobalImports = async () => {
    await writeFileIfChanged(
      api.resolveDotReam('templates/global-imports.js'),
      `
      ${api.config.imports
        .map((file) => `import ${JSON.stringify(file)}`)
        .join('\n')}
      `
    )
  }

  await Promise.all([
    writeRoutes(),
    writeEnhanceApp(api, projectEnhanceAppFiles),
    writeGlobalImports(),
  ])

  if (!api.isDev) {
    const writeConfig = async () => {
      const config = {
        port: api.config.server.port,
      }
      await writeFileIfChanged(
        api.resolveDotReam('meta/config.json'),
        JSON.stringify(config)
      )
    }

    await writeConfig()
  }

  if (api.isDev) {
    api.pluginContext.onFileChange(async (type, file) => {
      // Update routes
      if (file.startsWith(pagesDir) && routesFileRegexp.test(file)) {
        const relativePath = path.relative(pagesDir, file)
        if (type === 'add') {
          files.push(relativePath)
          await writeRoutes()
        } else if (type === 'unlink') {
          files.splice(files.indexOf(relativePath), 1)
          await writeRoutes()
        }
      }

      // Update enhanceApp
      if (projectEnhanceAppFiles.includes(file)) {
        await writeEnhanceApp(api, projectEnhanceAppFiles)
      }
    })
  }
}
