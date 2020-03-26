import path from 'path'
import express from 'express'
import { promisify } from 'util'
import { BundleRenderer, createBundleRenderer } from 'vue-server-renderer'
import devalue from 'devalue'
import { EvaluateModule, createModule } from 'virtual-module'
import unfetch from 'isomorphic-unfetch'
import { Router } from './router'
import { createServer } from 'http'
import { outputFile, copy } from 'fs-extra'

export interface ReamOptions {
  dir?: string
  dev?: boolean
  port?: number
}

export class Ream {
  dir: string
  dev: boolean
  serverBundle?: any
  clientManifest?: any
  bundleRenderer?: BundleRenderer
  evalueModule?: EvaluateModule
  router: Router
  port: number

  constructor(options: ReamOptions) {
    this.dev = Boolean(options.dev)
    process.env.NODE_ENV = this.dev ? 'development' : 'production'

    this.dir = path.resolve(options.dir || '')
    this.port = options.port || 3000
    this.router = new Router(this)
  }

  resolveRootDir(...args: string[]) {
    return path.resolve(this.dir, ...args)
  }

  resolveBuildDir(...args: string[]) {
    return path.resolve(this.dir, '.ream', ...args)
  }

  resolveAppDir(...args: string[]) {
    return path.join(__dirname, '../app', ...args)
  }

  initRenderer() {
    if (this.clientManifest && this.serverBundle) {
      this.bundleRenderer = createBundleRenderer(this.serverBundle, {
        clientManifest: this.clientManifest,
        inject: false,
        basedir: this.dir,
        runInNewContext: false,
      })
    }
    if (this.serverBundle) {
      this.evalueModule = createModule(this.serverBundle.files, {
        baseDir: this.dir,
        sandbox: false,
      })
    }
  }

  async prepare() {
    await this.router.load()
    await this.router.write()
    if (this.dev) {
      this.router.watch()
    }
  }

  async build() {
    const { createCompilers } = await import('./webpack/createCompilers')
    const [clientCompiler, serverCompiler] = createCompilers(this)
    await Promise.all([
      promisify(clientCompiler.run.bind(clientCompiler))(),
      promisify(serverCompiler.run.bind(serverCompiler))(),
    ])

    const server = createServer(this.getRequestHandler())
    server.listen(this.port)
    await this.exportPageProps()
    server.close()
  }

  async export() {
    const server = createServer(this.getRequestHandler())
    server.listen(this.port)

    if (!this.evalueModule || !this.serverBundle || !this.bundleRenderer) {
      return
    }

    await copy(this.resolveBuildDir('client'), this.resolveRootDir('exported'))

    for (const route of this.router.routes) {
      const response = await unfetch(
        `http://localhost:${this.port}${route.routePath}`
      )
      const routePath = route.routePath === '/' ? '/index' : route.routePath

      if (route.isApiRoute) {
        await outputFile(
          this.resolveRootDir(`exported${routePath}`),
          await response.text(),
          'utf8'
        )
      } else {
        await outputFile(
          this.resolveRootDir(`exported${routePath}.html`),
          await response.text(),
          'utf8'
        )
      }
    }

    await copy(this.resolveBuildDir('pageprops'), this.resolveRootDir('exported'))

    server.close()
  }

  async exportPageProps() {
    for (const route of this.router.routes) {
      const filename =
        route.routePath === '/'
          ? '/index.pageprops.json'
          : `${route.routePath}.pageprops.json`
      const res = await unfetch(`http://localhost:${this.port}${filename}`, {
        headers: {
          'x-ream-export-page-props': 'true',
          'x-ream-disable-serversideprops': 'true',
        },
      })
      if (res.status === 200) {
        await outputFile(
          this.resolveBuildDir(`pageprops${filename}`),
          await res.text(),
          'utf8'
        )
      }
    }
  }

  getRequestHandler() {
    const server = express()

    if (this.dev) {
      const devMiddlewares = require('./getDevMiddlewares').getDevMiddlewares(
        this
      )
      devMiddlewares.forEach((m: any) => server.use(m))
    } else {
      this.clientManifest = require(this.resolveBuildDir('client-manifest'))
      this.serverBundle = require(this.resolveBuildDir('server-bundle'))
      this.initRenderer()

      server.use(express.static(this.resolveBuildDir('client')))
    }

    const fetch = (url: string, options: any) => {
      if (url.startsWith('/')) {
        url = `http://localhost:${this.port}${url}`
      }
      return unfetch(url, options)
    }

    server.get('*.pageprops.json', async (req, res) => {
      if (!this.evalueModule) {
        return res.end(`Please wait for compilation to complete`)
      }

      const path = req.path
        .replace(/\.pageprops\.json$/, '')
        .replace(/^\/index$/, '/')

      const context: any = { path, res, fetch, exportPageProps: req.headers['x-ream-export-page-props'] }
      const props = await this.evalueModule(
        this.serverBundle.entry
      ).getAllPropsStandalone(context, {
        disableServerSideProps: req.headers['x-ream-disable-serversideprops'],
        disableStaticProps: req.headers['x-ream-disable-staticprops'],
      })
      if (props) {
        res.send(props.props)
      } else {
        res.statusCode = 404
        res.end()
      }
      return
    })

    server.get('*', async (req, res) => {
      try {
        const context: any = { path: req.path, res, fetch }

        if (!this.bundleRenderer || !this.evalueModule) {
          return res.end(`Wait for webpack to finish building..`)
        }

        if (req.path !== '/_document') {
          const apiRoute = this.router.getMatchedApiRoute(req.path)
          if (apiRoute) {
            req.params = apiRoute.params
            const load = this.evalueModule(
              this.serverBundle.entry
            ).getServerModule(apiRoute.chunkName)
            const handler = await load().then((res: any) => res.default)
            handler(req, res)
            return
          }
        }

        const result = await this.bundleRenderer.renderToString(context)
        const meta = context.app.$meta().inject()
        const document = await this.evalueModule(
          this.serverBundle.entry
        ).getDocument({
          get htmlAttrs() {
            return meta.htmlAttrs.text(true)
          },
          get headAttrs() {
            return meta.headAttrs.text()
          },
          get bodyAttrs() {
            return meta.bodyAttrs.text()
          },
          get head() {
            return `${meta.meta.text()}
              ${meta.title.text()}
              ${meta.link.text()}
              ${context.renderStyles()}
              ${meta.style.text()}
              ${meta.script.text()}
              ${meta.noscript.text()}
              ${context.renderResourceHints()}`
          },
          get scripts() {
            return `<script>__REAM__=${devalue({
              pageProps: context.__pageProps,
            })}</script>
            ${context.renderScripts()}
            ${meta.style.text({ body: true })}
            ${meta.script.text({ body: true })}
            ${meta.noscript.text({ body: true })}
            `
          },
          get app() {
            return `
            ${meta.style.text({ pbody: true })}
            ${meta.script.text({ pbody: true })}
            ${meta.noscript.text({ pbody: true })}
            ${result}
            `
          },
        })
        res.end(`<!DOCTYPE html>${document}`)
      } catch (error) {
        console.error(error)
      }
    })
    return server
  }
}
