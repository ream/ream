import glob from 'fast-glob'
import { outputFile, pathExists } from 'fs-extra'
import { Ream } from './node'
import { store } from './store'
import { Route } from './utils/route'
import path from 'path'
import { filesToRoutes } from './utils/load-routes'

export async function prepareFiles(api: Ream) {
  const routesDir = api.resolveSrcDir('routes')
  const routesFilePattern = '**/*.{vue,ts,tsx,js,jsx}'

  if (!(await pathExists(routesDir))) {
    throw new Error(`${routesDir} doesn't exist`)
  }

  const files = await glob(routesFilePattern, {
    cwd: routesDir,
    onlyFiles: true,
    ignore: ['node_modules', 'dist'],
  })

  const writeRoutes = async () => {
    const routesInfo = filesToRoutes(files, routesDir)

    const getRelativePathToTemplatesDir = (p: string) => {
      return path.relative(api.resolveDotReam('templates'), p)
    }

    const stringifyClientRoutes = (routes: Route[]): string => `[
      ${routes
        .filter((route) => !route.isServerRoute)
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
        .join(',')}
    ]`

    const stringifyServerRoutes = (routes: Route[]): string => `[
      ${routes
        .filter((route) => route.isServerRoute)
        .map((route) => {
          return `{
          path: "${path}",
          meta: {load: () => import("${getRelativePathToTemplatesDir(
            route.file
          )}")},
          component: {setup(){}}
        }`
        })
        .join(',')}
    ]`

    const clientRoutesContent = `
    import { h, defineAsyncComponent } from 'vue'
    import { usePageData } from 'ream/data'

    var ErrorComponent = defineAsyncComponent(function() {
      return import("${getRelativePathToTemplatesDir(routesInfo.errorFile)}")
    })

    var wrapPage = function(page) {
      return {
        $$preload: page.preload,
        $$clientPreload: page.clientPreload,
        $$staticPreload: page.staticPreload,
        $$getStaticPaths: page.getStaticPaths,
        setup: function () {
          return function() {
            var Component = page.default
            var pageData = usePageData()
            if (pageData && pageData.error) {
              Component = ErrorComponent
            }
            return h(Component)
          }
        }
      }
    }

    export var AppComponent = defineAsyncComponent(function() {
      return import("${getRelativePathToTemplatesDir(routesInfo.appFile)}")
    })

    export var clientRoutes = ${stringifyClientRoutes(routesInfo.routes)}
    `

    await outputFile(
      api.resolveDotReam('templates/client-routes.js'),
      clientRoutesContent,
      'utf8'
    )

    const serverExportsContent = `
   export const serverRoutes = ${stringifyServerRoutes(routesInfo.routes)}

   export const _document = () => import("${routesInfo.documentFile}")
    `

    await outputFile(
      api.resolveDotReam('templates/server-exports.js'),
      serverExportsContent,
      'utf8'
    )

    await outputFile(
      api.resolveDotReam('manifest/routes-info.json'),
      JSON.stringify(routesInfo, null, 2),
      'utf8'
    )

    await outputFile(
      api.resolveDotReam('templates/global-imports.js'),
      `
      import '@ream/fetch'
      ${api.config.css
        .map((file) => `import ${JSON.stringify(file)}`)
        .join('\n')}
      `,
      'utf8'
    )

    await outputFile(
      api.resolveDotReam('templates/enhance-app.js'),
      `
    var files = [
      ${[...store.state.pluginsFiles['enhance-app']].map((file) => {
        return `require(${JSON.stringify(file)})`
      })}
    ]

    var exec = function(name, context) {
      for (var i = 0; i < files.length; i++) {
        var file = files[i]
        if (file[name]) {
          file[name](context)
        }
      }
    }

    export function onCreatedApp(context) {
      exec('onCreatedApp', context)
    }
    `,
      'utf8'
    )
  }

  await writeRoutes()

  if (api.isDev) {
    const { watch } = await import('chokidar')
    watch(routesFilePattern, {
      cwd: routesDir,
      ignoreInitial: true,
    })
      .on('add', async (file) => {
        files.push(file)
        await writeRoutes()
      })
      .on('unlink', async (file) => {
        files.splice(files.indexOf(file), 1)
        await writeRoutes()
      })
  }
}
