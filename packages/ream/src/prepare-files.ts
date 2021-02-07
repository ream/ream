import glob from 'fast-glob'
import { outputFile, pathExists } from 'fs-extra'
import { Ream } from './node'
import { store } from './store'
import { Route } from './utils/route'
import path from 'path'
import { filesToRoutes } from './utils/load-routes'

export async function prepareFiles(api: Ream) {
  const pagesDir = api.resolveSrcDir('pages')
  const routesFilePattern = '**/*.{vue,ts,tsx,js,jsx}'

  if (!(await pathExists(pagesDir))) {
    throw new Error(`${pagesDir} doesn't exist`)
  }

  const files = await glob(routesFilePattern, {
    cwd: pagesDir,
    onlyFiles: true,
    ignore: ['node_modules', 'dist'],
  })

  const writeRoutes = async () => {
    const routesInfo = filesToRoutes(files, pagesDir)

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
            path: '/:404(.*)',
            name: '404',
            component: {}
          }
      ]`
    }

    const sharedExportsContent = `
    import { h, defineAsyncComponent } from 'vue'
    import { usePageData } from 'ream/data'

    var ErrorComponent = defineAsyncComponent(function() {
      return import("${getRelativePathToTemplatesDir(routesInfo.errorFile)}")
    })

    var AppComponent = defineAsyncComponent(function() {
      return import("${getRelativePathToTemplatesDir(routesInfo.appFile)}")
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

    var clientRoutes = ${stringifyClientRoutes(routesInfo.routes)}

    export {
      clientRoutes,
      ErrorComponent,
      AppComponent
    }
    `

    await outputFile(
      api.resolveDotReam('templates/shared-exports.js'),
      sharedExportsContent,
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
      cwd: pagesDir,
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
