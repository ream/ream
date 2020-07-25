import glob from 'fast-glob'
import { pathToRoutes, pathToRoute } from './utils/path-to-routes'
import { outputFile } from 'fs-extra'
import { Ream } from './node'
import { store } from './store'
import { Route } from './utils/route'
import { sortRoutesByScore } from './utils/rank-routes'
import { SERVER_PRELOAD_INDICATOR } from './babel/constants'

function getRoutes(_routes: Route[], ownRoutesDir: string) {
  const routes: Route[] = [..._routes]

  const patterns = [
    {
      require: (route: Route) => route.entryName === 'routes/_error',
      filename: '_error.js',
    },
    {
      require: (route: Route) => route.entryName === 'routes/_app',
      filename: '_app.js',
    },
    {
      require: (route: Route) => route.entryName === 'routes/_document',
      filename: '_document.js',
    },
    {
      require: (route: Route) => route.entryName === 'routes/404',
      filename: '404.js',
    },
  ]
  for (const pattern of patterns) {
    if (!routes.some(pattern.require)) {
      routes.push(pathToRoute(pattern.filename, ownRoutesDir, routes.length))
    }
  }
  return sortRoutesByScore(routes)
}

export async function prepareFiles(api: Ream) {
  const pattern = '**/*.{vue,js,ts,jsx,tsx}'
  const routesDir = api.resolveRoot('routes')
  const files = new Set(
    await glob(pattern, {
      cwd: routesDir,
    })
  )

  const writeRoutes = async () => {
    const routes = getRoutes(
      pathToRoutes([...files], routesDir),
      api.resolveVueApp('routes')
    )

    let appRoute: Route
    let errorRoute: Route
    for (const route of routes) {
      if (route.entryName === 'routes/_app') {
        appRoute = route
      } else if (route.entryName === 'routes/_error') {
        errorRoute = route
      }
    }

    const clientRoutesContent = `
    import { h } from 'vue'

    var getAppComponent = function() {
      return import(/* webpackChunkName: "${appRoute!.entryName}" */ "${
      appRoute!.absolutePath
    }")
    }
    var getErrorComponent = function() {
      return import(/* webpackChunkName: "${errorRoute!.entryName}" */ "${
      errorRoute!.absolutePath
    }")
    }

    var wrapPage = function(res) {
      var _app = res[0], _error = res[1], page = res[2]
      var Component = page.default
      return {
        preload: page.preload,
        hasServerPreload: page["${SERVER_PRELOAD_INDICATOR}"],
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
              import(/* webpackChunkName: ${JSON.stringify(
                route.entryName
              )} */ ${JSON.stringify(route.absolutePath)})
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
    var routes = {}
    
    ${routes
      .map((route) => {
        return `routes[${JSON.stringify(
          route.entryName
        )}] = () => import(/* webpackChunkName: "${
          route.entryName
        }" */ ${JSON.stringify(route.absolutePath)})`
      })
      .join('\n')}

    export {
      routes
    }
    `

    await outputFile(
      api.resolveDotReam('templates/all-routes.js'),
      allRoutesContent,
      'utf8'
    )

    await outputFile(
      api.resolveDotReam('manifest/routes-info.json'),
      JSON.stringify(routes, null, 2),
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
        api.invalidate()
      })
      .on('unlink', async (file) => {
        files.delete(file)
        await writeRoutes()
        api.invalidate()
      })
  }
}
