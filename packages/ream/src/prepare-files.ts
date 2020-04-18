import glob from 'fast-glob'
import { pathToRoutes } from './utils/path-to-routes'
import { outputFile } from 'fs-extra'
import { Ream } from '.'
import {
  GET_SERVER_SIDE_PROPS_INDICATOR,
  GET_STATIC_PROPS_INDICATOR,
} from './babel/plugins/page-exports-transforms'
import { store } from './store'
import { Route } from '@ream/common/dist/route'

export async function prepareFiles(api: Ream) {
  const pattern = '**/*.{vue,js,ts,jsx,tsx}'
  const cwd = api.resolveRoot('pages')
  const files = new Set(
    await glob(pattern, {
      cwd,
    })
  )

  const writeRoutes = async () => {
    api._routes = pathToRoutes([...files], cwd)

    const routes = api.routes
    let appRoute: Route
    let errorRoute: Route
    for (const route of routes) {
      if (route.entryName === 'pages/_app') {
        appRoute = route
      } else if (route.entryName === 'pages/_error') {
        errorRoute = route
      }
    }

    const clientRoutesContent = `
    var getAppComponent = function() {
      return import(/* webpackChunkName: "${appRoute!.entryName}" */ "${appRoute!.absolutePath}")
    }
    var getErrorComponent = function() {
      return import(/* webpackChunkName: "${errorRoute!.entryName}" */ "${errorRoute!.absolutePath}")
    }

    var wrapPage = function(res) {
      var _app = res[0], _error = res[1], page = res[2]
      return {
        functional: true,
        getServerSideProps: page[${JSON.stringify(
          GET_SERVER_SIDE_PROPS_INDICATOR
        )}],
        getStaticProps: page[${JSON.stringify(GET_STATIC_PROPS_INDICATOR)}],
        render(h, ctx) {
          var pageProps = ctx.parent.$root.$options.pageProps
          var Component = page.default
          if (pageProps && pageProps.__ream_error__) {
            Component = _error.default
          }
          return h(_app.default, {
            props: {
              Component: Component,
              pageProps: pageProps
            }
          })
        }
      }
    }

    var routes = [
      ${routes
        .filter(route => route.isClientRoute)
        .map(route => {
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
      api.resolveDotReam('client-routes.js'),
      clientRoutesContent,
      'utf8'
    )

    const allRoutesContent = `
    var routes = {}
    
    ${routes
      .map(route => {
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
      api.resolveDotReam('all-routes.js'),
      allRoutesContent,
      'utf8'
    )

    await outputFile(
      api.resolveDotReam('routes-info.json'),
      JSON.stringify(api.routes, null, 2),
      'utf8'
    )

    await outputFile(
      api.resolveDotReam('enhance-app.js'),
      `
    var files = [
      ${[...store.state.pluginsFiles['enhance-app']].map(file => {
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
      cwd,
      ignoreInitial: true,
    })
      .on('add', async file => {
        files.add(file)
        await writeRoutes()
        api.invalidate()
      })
      .on('unlink', async file => {
        files.delete(file)
        await writeRoutes()
        api.invalidate()
      })
  }
}
