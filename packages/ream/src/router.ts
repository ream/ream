import { join } from 'path'
import { Ream } from '.'
import fs from 'fs-extra'
import glob from 'fast-glob'
import regexparam from 'regexparam'

function exec(path: string, result: { keys: string[]; pattern: RegExp }) {
  let i = 0,
    out: { [k: string]: any } = {}
  let matches = result.pattern.exec(path)
  if (matches) {
    while (i < result.keys.length) {
      out[result.keys[i]] = matches[++i] || null
    }
  }
  return out
}

const SPECIAL_ROUTE_FILES = ['_error.vue', '_app.vue', '_document.js']

function ignoreFileStartingWithUnderscore(file: string) {
  if (file.startsWith('_') || file.includes('/_'))  {
    return false
  }
  return true
}

export class Router {
  ream: Ream
  pattern: string
  files: Set<string>
  cwd: string
  private routesContent: string
  private appContent: string

  constructor(ream: Ream) {
    this.ream = ream
    this.pattern = '**/*.{vue,js}'
    this.cwd = this.ream.resolveRootDir('routes')
    this.files = new Set()
    this.routesContent = ''
    this.appContent = ''
  }

  /**
   * Load files from routes dir
   */
  async load() {
    const files = new Set(
      await glob(this.pattern, {
        cwd: this.cwd,
      })
    )
    this.files = new Set(files)
  }

  private fileToRoutePath(relativePath: string) {
    const routePath = `/${relativePath}`
            .replace(/\.[a-zA-Z0-9]+$/, '')
            .replace(/\[([^\]]+)\]/, ':$1')
            .replace(/\/index$/, '')
    return {
      chunkName: `route-${relativePath.replace(
        /[^a-zA-Z0-9\[\]_\-]/g,
        '-'
      )}`,
      routePath: routePath === '' ? '/' : routePath,
      relativePath,
      isApiRoute: relativePath.endsWith('.js'),
      absolutePath: join(this.cwd, relativePath),
    }
  }

  addFile(file: string) {
    this.files.add(file)
  }

  removeFile(file: string) {
    this.files.delete(file)
  }

  get routes() {
    return [...this.files]
      .filter(file => ignoreFileStartingWithUnderscore(file))
      .map(relativePath => {
        return this.fileToRoutePath(relativePath)
      })
  }

  get specialRoutes() {
    return SPECIAL_ROUTE_FILES.filter(file => {
      return this.files.has(file)
    }).map(file => this.fileToRoutePath(file))
  }

  getMatchedApiRoute(path: string) {
    const apiRoutes = this.routes.filter(route => route.isApiRoute)
    for (const route of apiRoutes) {
      const result = regexparam(route.routePath)
      if (result.pattern.test(path)) {
        const params = exec(path, result)
        return { chunkName: route.chunkName, params }
      }
    }
    return null
  }

  async write() {
    await Promise.all([this.writeRoutesFile(), this.writeAppFile()])
  }

  async writeRoutesFile() {
    const routes = this.routes
    const specialRoutes = this.specialRoutes

    const newContent = `
      import App from '#build/app'

      var wrapComponent = function(c) {
        return {
          functional: true,
          getServerSideProps: c.getServerSideProps,
          getStaticProps: c.getStaticProps,
          render: function(h, ctx) {
            return h(App, {
              props: {
                pageProps: ctx.parent.$root.$options.__pageProps,
                Component: c.default
              }
            })
          }
        }
      }
      
      export default [${routes
        .filter(route => !route.isApiRoute)
        .map(route => {
          return `{
          path: ${JSON.stringify(route.routePath)},
          component: function() {
            return import(/* webpackChunkName: ${JSON.stringify(
              route.chunkName
            )} */ ${JSON.stringify(route.absolutePath)}).then(wrapComponent)
          }
        }`
        })
        .join(',')}]   
        
       // Compile these modules in server build
       var serverModules
       if (!process.browser) {
        serverModules = new Map()
        ${[...routes,...specialRoutes]
          .filter(route => route.isApiRoute)
          .map(route => {
            return `
            serverModules.set(${JSON.stringify(route.chunkName)}, function() {
              return import(/* webpackChunkName: ${JSON.stringify(
                route.chunkName
              )} */ ${JSON.stringify(route.absolutePath)})
            })
            `
          })
          .join('\n')}
       }

       export {
        serverModules
       }
      `

    if (newContent === this.routesContent) {
      return
    }

    this.routesContent = newContent
    await fs.outputFile(
      this.ream.resolveBuildDir('routes.js'),
      newContent,
      'utf8'
    )
  }

  async writeAppFile() {
    const newContent = this.files.has('_app.vue')
      ? `import App from ${JSON.stringify(
          join(this.cwd, '_app.vue')
        )};export default App;
    `
      : `import { App } from '#app/app';export default App;`

    if (newContent === this.appContent) {
      return
    }

    this.appContent = newContent
    await fs.outputFile(this.ream.resolveBuildDir('app.js'), newContent, 'utf8')
  }

  async watch() {
    const { watch } = await import('chokidar')
    const watcher = watch(this.pattern, {
      cwd: this.cwd,
      ignoreInitial: true,
    })
    watcher
      .on('add', file => {
        this.addFile(file)
        this.write()
      })
      .on('unlink', file => {
        this.removeFile(file)
        this.write()
      })
  }
}
