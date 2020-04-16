import glob from 'fast-glob'
import { pathToRoutes } from './utils/path-to-routes'
import { outputFile } from 'fs-extra'
import { Ream } from '.'
import {
  GET_SERVER_SIDE_PROPS_INDICATOR,
  GET_STATIC_PROPS_INDICATOR,
} from './babel/plugins/page-exports-transforms'

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
    let appPath: string
    let errorPath: string
    for (const route of routes) {
      if (route.entryName === 'pages/_app') {
        appPath = route.absolutePath
      } else if (route.entryName === 'pages/_error') {
        errorPath = route.absolutePath
      }
    }

    const clientRoutes = `
    var _app = require(${JSON.stringify(appPath!)})
    var _error = require(${JSON.stringify(errorPath!)})

    var wrapPage = function(page) {
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
            return import(/* webpackChunkName: ${JSON.stringify(
              route.entryName
            )} */ ${JSON.stringify(route.absolutePath)}).then(wrapPage)
          }
        }`
        })
        .join(',')}
    ]

    export {
      routes,
      _app
    }
    `

    await outputFile(
      api.resolveDotReam('client-routes.js'),
      clientRoutes,
      'utf8'
    )

    await outputFile(
      api.resolveDotReam('routes.json'),
      JSON.stringify(api.routes, null, 2),
      'utf8'
    )

    await outputFile(api.resolveDotReam('enhance-app.js'), `
    var files = [
      ${api.enhanceApp.files.map(file => {
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
    `,'utf8')
    
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
