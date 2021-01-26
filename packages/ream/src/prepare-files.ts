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
          component: function() {
            return Promise.all([
              getAppComponent(),
              getErrorComponent(),
              import("${getRelativePathToTemplatesDir(route.file)}")
            ]).then(wrapPage)
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
    import { h } from 'vue'

    var getAppComponent = function() {
      return import("${getRelativePathToTemplatesDir(routesInfo.appFile)}")
    }
    var getErrorComponent = function() {
      return import("${getRelativePathToTemplatesDir(routesInfo.errorFile)}")
    }

    var wrapPage = function(res) {
      var _app = res[0], _error = res[1], page = res[2]
      var Component = page.default
      return {
        $$preload: page.preload,
        $$clientPreload: page.clientPreload,
        $$staticPreload: page.staticPreload,
        $$getStaticPaths: page.getStaticPaths,
        render: function () {
          var pagePropsStore = this.$root.pagePropsStore
          var pageProps = pagePropsStore && pagePropsStore[this.$route.path]
          if (pageProps && pageProps.error) {
            Component = _error.default
          }
          return h(_app.default, {
            Component: Component,
            pageProps: pageProps,
            key: this.$route.path
          })
        }
      }
    }

    export const clientRoutes = ${stringifyClientRoutes(routesInfo.routes)}
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
