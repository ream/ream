import glob from 'fast-glob'
import { pathToRoute, pathToRoutes } from './utils/path-to-routes'
import { outputFile, pathExists } from 'fs-extra'
import { Ream } from './node'
import { store } from './store'
import { Route } from './utils/route'
import { sortRoutesByScore } from './utils/rank-routes'
import {
  SERVER_PRELOAD_INDICATOR,
  STATIC_PRELOAD_INDICATOR,
} from './babel/constants'
import path from 'path'

function getRoutes(_routes: Route[], ownRoutesDir: string) {
  const routes: Route[] = []

  let errorFile = path.join(ownRoutesDir, '_error.js')
  let documentFile = path.join(ownRoutesDir, '_document.js')
  let appFile = path.join(ownRoutesDir, '_app.js')
  let catchAllRoute: Route = pathToRoute('404.js', ownRoutesDir, 0)

  for (const route of _routes) {
    if (route.routePath === '/_error') {
      errorFile = route.absolutePath
    } else if (route.routePath === '/_document') {
      documentFile = route.absolutePath
    } else if (route.routePath === '/_app') {
      appFile = route.routePath
    } else if (route.routePath === '/404') {
      catchAllRoute = pathToRoute(
        route.relativePath,
        path.dirname(route.absolutePath),
        0
      )
    } else {
      routes.push(route)
    }
  }

  routes.push(catchAllRoute)

  return {
    routes: sortRoutesByScore(routes),
    errorFile,
    documentFile,
    appFile,
  }
}

export async function prepareFiles(api: Ream) {
  const pattern = '**/*.{vue,js,ts,jsx,tsx}'
  const routesDir = api.resolveSrcDir('routes')

  if (!(await pathExists(routesDir))) {
    throw new Error(`${routesDir} doesn't exist`)
  }

  const files = new Set(
    await glob(pattern, {
      cwd: routesDir,
    })
  )

  const writeRoutes = async () => {
    const {
      routes,
      appFile,
      errorFile,
      documentFile,
      notFoundFile,
    } = getRoutes(
      pathToRoutes([...files], routesDir),
      api.resolveVueApp('routes')
    )

    const getRelativePathToTemplatesDir = (p: string) => {
      return path.relative(api.resolveDotReam('templates'), p)
    }

    const clientRoutesContent = `
    import { h } from 'vue'

    var getAppComponent = function() {
      return import("${getRelativePathToTemplatesDir(appFile)}")
    }
    var getErrorComponent = function() {
      return import("${getRelativePathToTemplatesDir(errorFile)}")
    }

    var wrapPage = function(res) {
      var _app = res[0], _error = res[1], page = res[2]
      var Component = page.default
      return {
        preload: page.preload,
        hasServerPreload: page["${SERVER_PRELOAD_INDICATOR}"] || page["${STATIC_PRELOAD_INDICATOR}"],
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

    var routes = [
      ${routes
        .filter((route) => route.isClientRoute)
        .map((route) => {
          return `{
          path: ${JSON.stringify(route.routePath)},
          component: function() {
            return Promise.all([
              getAppComponent(),
              getErrorComponent(),
              import("${getRelativePathToTemplatesDir(route.absolutePath)}")
            ]).then(wrapPage)
          }
        }`
        })
        .join(',')}
    ]

    export {
      routes
    }
    `

    await outputFile(
      api.resolveDotReam('templates/client-routes.js'),
      clientRoutesContent,
      'utf8'
    )

    const allRoutesContent = `
   export default [
    ${routes
      .map((route) => {
        return `{
        entryName: "${route.entryName}",
        type: "${route.isServerRoute ? 'server' : 'client'}",
        load: () => import("${getRelativePathToTemplatesDir(
          route.absolutePath
        )}")
      }`
      })
      .join(',')}
   ]
    `

    await outputFile(
      api.resolveDotReam('templates/all-routes.js'),
      allRoutesContent,
      'utf8'
    )

    await outputFile(
      api.resolveDotReam('manifest/routes-info.json'),
      JSON.stringify(
        {
          routes,
          errorFile,
          documentFile,
          appFile,
          notFoundFile,
        },
        null,
        2
      ),
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
    watch(pattern, {
      cwd: routesDir,
      ignoreInitial: true,
    })
      .on('add', async (file) => {
        files.add(file)
        await writeRoutes()
      })
      .on('unlink', async (file) => {
        files.delete(file)
        await writeRoutes()
      })
  }
}
