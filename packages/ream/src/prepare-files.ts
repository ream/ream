import glob from 'fast-glob'
import { outputFile, pathExists, readFile } from 'fs-extra'
import consola from 'consola'
import { Ream, Route } from './'
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

const writeHookFile = async (
  api: Ream,
  type: 'app' | 'server',
  projectFiles: string[]
) => {
  const { pluginsFiles } = api.state
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

  await writeFileIfChanged(
    api.resolveDotReam(`templates/ream.${type}.js`),
    content
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

  const projectAppHookFiles = [
    api.resolveRootDir('ream.app.js'),
    api.resolveRootDir('ream.app.ts'),
  ]

  const projectServerHookFiles = [
    api.resolveRootDir('ream.server.js'),
    api.resolveRootDir('ream.server.ts'),
  ]

  const writeRoutes = async () => {
    const routesInfo = filesToRoutes(files, pagesDir)

    const getRoutes = api.config.routes
    if (getRoutes) {
      consola.info(`Loading extra routes`)
    }
    const routes = getRoutes
      ? await getRoutes(routesInfo.routes)
      : routesInfo.routes

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
            name: "${route.name}",
            meta: {},
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
   export const serverRoutes = ${stringifyServerRoutes(routes)}
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
    writeHookFile(api, 'app', projectAppHookFiles),
    writeHookFile(api, 'server', projectServerHookFiles),
    writeGlobalImports(),
  ])

  if (!api.isDev) {
    const writeServerContext = async () => {
      await writeFileIfChanged(
        api.resolveDotReam('meta/server-context.js'),
        `const serverContext = {
          ssrManifest: require('../manifest/ssr-manifest'),
          clientManifest: require('../manifest/client-manifest'),
          serverEntry: require('../server/server-entry.js').default,
          // Export info is only available after exporting
          // So we lazy load it here
          getExportManifest: () => require('../manifest/export-manifest')
        }
        
        module.exports = {
          serverContext,
          get handler() {
            const { createServer } = require('ream/server')
            return createServer({ context: serverContext })
          }
        }
        `
      )
    }
    await writeServerContext()
  }

  if (api.isDev) {
    api.state.callbacks.onFileChange.add({
      pluginName: 'ream:prepare-files',
      callback: async (type, file) => {
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
        if (projectAppHookFiles.includes(file)) {
          await writeHookFile(api, 'app', projectAppHookFiles)
        }
        if (projectServerHookFiles.includes(file)) {
          await writeHookFile(api, 'server', projectServerHookFiles)
        }
      },
    })
  }
}
