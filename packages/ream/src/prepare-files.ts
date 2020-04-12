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
    const appRoute = api._routes.find(route => route.routePath === '/_app')
    const appPath = appRoute
      ? appRoute.absolutePath
      : api.resolveApp('pages/_app')
    const clientRoutes = `
    var _app = require(${JSON.stringify(appPath)})

    var App = _app.createApp()

    var wrapPage = function(page) {
      return {
        functional: true,
        getServerSideProps: page[${JSON.stringify(GET_SERVER_SIDE_PROPS_INDICATOR)}],
        getStaticProps: page[${JSON.stringify(GET_STATIC_PROPS_INDICATOR)}],
        render(h, ctx) {
          return h(App, {
            props: {
              Component: page.default,
              pageProps: ctx.parent.$root.$options.pageProps
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
