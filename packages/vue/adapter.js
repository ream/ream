// @ts-check
const fs = require('fs')
const path = require('path')
const glob = require('fast-glob')
const { filesToRoutes, normalizePath } = require('ream')

/**
 * @param {string} p
 * @returns {boolean}
 */
const isAbsolutPath = (p) => /^\/|[a-zA-Z]:/.test(p)

/** @type {import('./adapter')} */
module.exports = () => {
  return {
    name: `vue`,

    apply(ctx) {
      const pagesDir = ctx.resolveSrcDir('pages')
      const routesFileGlob = '**/*.{vue,ts,tsx,js,jsx}'
      const routesFileRegexp = /\.(vue|ts|tsx|js|jsx)$/
      /** @type {string[]} */
      let files = []

      ctx.setRuntimeDir(path.join(__dirname, './runtime-dist'))

      const writeRoutes = async () => {
        const routesInfo = filesToRoutes(files, pagesDir)

        const getRoutes = ctx.config.routes
        if (getRoutes) {
          console.info(`Loading extra routes`)
        }
        const routes = getRoutes
          ? await getRoutes(routesInfo.routes)
          : routesInfo.routes

        /**
         *
         * @param {string} p
         * @returns {string}
         */
        const getRelativePathToTemplatesDir = (p) => {
          if (!isAbsolutPath(p)) {
            return p
          }
          return normalizePath(
            path.relative(ctx.resolveDotReam('templates'), p)
          )
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
          return import("${getRelativePathToTemplatesDir(
            routesInfo.errorFile
          )}")
        })
    
        var AppComponent = defineAsyncComponent(function() {
          return import("${getRelativePathToTemplatesDir(routesInfo.appFile)}")
        })
    
        var NotFoundComponent = defineAsyncComponent(function() {
          return import("${getRelativePathToTemplatesDir(
            routesInfo.notFoundFile
          )}")
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

      ctx.onPrepareFiles(async () => {
        if (!fs.existsSync(pagesDir)) {
          throw new Error(`${pagesDir} doesn't exist`)
        }

        files = await glob(routesFileGlob, {
          cwd: pagesDir,
          onlyFiles: true,
          ignore: ['node_modules', 'dist'],
        })
      })

      ctx.onFileChange(async (type, file) => {
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
      })
    },
  }
}
