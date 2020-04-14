import glob from 'fast-glob'
import { pathToRoutes } from './utils/path-to-routes'
import { outputFile } from 'fs-extra'
import { Ream } from '.'
import { GET_SERVER_SIDE_PROPS_INDICATOR, GET_STATIC_PROPS_INDICATOR } from './babel/plugins/page-exports-transforms'

export async function prepareFiles(api: Ream) {
  const pattern = '**/*.{vue,js,ts,jsx,tsx}'
  const cwd = api.resolveRoot('pages')
  const files = new Set(
    await glob(pattern, {
      cwd,
    })
  )
  api._routes = pathToRoutes([...files], cwd)

  const writeRoutes = async () => {
    let appPath: string | undefined
    let errorPath: string | undefined
    for (const route of api._routes) {
      if (route.routePath === '/_app') {
        appPath = route.absolutePath
      } else if (route.routePath === '/_error') {
        errorPath = route.absolutePath
      }
    }
    if (!appPath) {
      appPath = api.resolveApp('pages/_app')
    }
    if (!errorPath) {
      errorPath = api.resolveApp('pages/_error')
    }

    const clientRoutes = `
    var _app = require(${JSON.stringify(appPath)})
    var _error = require(${JSON.stringify(errorPath)})

    var App = _app.createApp()

    var wrapPage = function(page) {
      return {
        functional: true,
        getServerSideProps: page[${JSON.stringify(GET_SERVER_SIDE_PROPS_INDICATOR)}],
        getStaticProps: page[${JSON.stringify(GET_STATIC_PROPS_INDICATOR)}],
        render(h, ctx) {
          var pageProps = ctx.parent.$root.$options.pageProps
          var Component = page.default
          if (pageProps && pageProps.__ream_error__) {
            Component = _error.default
          }
          return h(App, {
            props: {
              Component: Component,
              pageProps: pageProps
            }
          })
        }
      }
    }

    var routes = [
      ${api._routes
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

    // Write out routes.json for later use by `ream start`
    if (api.prepareType === 'build') {
      await outputFile(
        api.resolveDotReam('routes.json'),
        JSON.stringify(api._routes, null, 2),
        'utf8'
      )
    }
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
        api._routes = pathToRoutes([...files], cwd)
        await writeRoutes()
        api.invalidate()
      })
      .on('unlink', async file => {
        files.delete(file)
        api._routes = pathToRoutes([...files], cwd)
        await writeRoutes()
        api.invalidate()
      })
  }
}
