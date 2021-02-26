import path from 'path'
import type { Router, RouteRecordRaw } from 'vue-router'
import type { HTMLResult as HeadResult } from '@vueuse/head'
import serveStatic from 'serve-static'
import type { GetDocument, Preload } from '@ream/app'
import { Server } from './server'
import { render, renderToHTML, getPreloadData } from './render'
import { outputFile } from './fs'

export {
  ReamServerHandler,
  ReamServerRequest,
  ReamServerResponse,
} from './server'

export { Connect } from './connect'

export type ServerEntry = {
  render: any
  createClientRouter: () => Router
  createServerRouter: (routes: RouteRecordRaw[]) => Router
  _document: () => Promise<{
    default: GetDocument
  }>
  renderHeadToString: (app: any) => HeadResult
  ErrorComponent: any
  serverRoutes: RouteRecordRaw[]
  clientRoutes: RouteRecordRaw[]
  getGlobalPreload: () => Promise<Preload | undefined>
}

type LoadServerEntry = () => Promise<ServerEntry> | ServerEntry

export type ExportInfo = {
  /** The paths that have been exported at build time */
  staticPaths: string[]
  /** The raw paths that should fallback to render on demand */
  fallbackPathsRaw: string[]
}

type CreateServerContext = {
  /**
   * Development mode
   * @default {false}
   */
  dev?: boolean
  /**
   * Path to your project
   * i.e. the directory where we create the .ream folder
   * @default {`.ream`}
   */
  cwd?: string
  devMiddleware?: any
  loadServerEntry?: LoadServerEntry
  ssrFixStacktrace?: (err: Error) => void
  loadExportInfo?: () => ExportInfo
}

export { render, renderToHTML, getPreloadData }

export const extractClientManifest = (dotReamDir: string) => {
  const clientManifest = require(path.join(
    dotReamDir,
    'manifest/client-manifest.json'
  ))
  for (const key of Object.keys(clientManifest)) {
    const value: any = clientManifest[key]
    if (value.isEntry) {
      return {
        scripts: `<script type="module" src="/${value.file}"></script>`,
        styles: value.css
          ? value.css.map(
              (name: string) => `<link rel="stylesheet" href="/${name}">`
            )
          : '',
      }
    }
  }
}

export const writeCacheFiles = async (files: Map<string, string>) => {
  await Promise.all(
    [...files.keys()].map(async (file) => {
      const content = files.get(file)
      await outputFile(file, content!, 'utf8')
    })
  )
}

export const start = async (
  cwd: string = '.',
  options: { port?: number } = {}
) => {
  const config = require(path.resolve(cwd, '.ream/meta/config.json'))

  const port = `${options.port || config.port || 3000}`
  if (!process.env.PORT) {
    process.env.PORT = port
  }

  const { createServer } = await import('./')
  const server = await createServer({
    cwd,
  })
  server.listen(port)
  console.log(`> http://localhost:${port}`)
}

export async function createServer(ctx: CreateServerContext = {}) {
  const dotReamDir = path.resolve(ctx.cwd || '.', '.ream')

  const server = new Server()

  let ssrManifest: any
  let serverEntry: ServerEntry
  let scripts = ''
  let styles = ''
  // A vue-router instance for matching server routes (aka API routes)
  let serverRouter: Router | undefined

  const loadServerEntry: LoadServerEntry =
    ctx.loadServerEntry ||
    (() => require(path.join(dotReamDir, 'server/server-entry.js')).default)

  const exportInfo = ctx.dev
    ? undefined
    : (require(path.join(dotReamDir, 'meta/export-info.json')) as ExportInfo)

  if (ctx.dev) {
    if (ctx.devMiddleware) {
      server.use(ctx.devMiddleware)
    }
    ssrManifest = {}
  } else {
    ssrManifest = require(path.join(dotReamDir, 'manifest/ssr-manifest.json'))
    const extractedAssets = extractClientManifest(dotReamDir)
    if (extractedAssets) {
      scripts = extractedAssets.scripts
      styles = extractedAssets.styles
    }

    const serveStaticFiles = serveStatic(path.join(dotReamDir, 'client'))
    server.use(serveStaticFiles as any)
  }

  server.use(async (req, res, next) => {
    if (ctx.dev || !serverEntry) {
      serverEntry = await loadServerEntry()
    }
    next()
  })

  server.use(async (req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      return next()
    }

    if (!serverRouter || ctx.dev) {
      serverRouter = serverEntry.createServerRouter(serverEntry.serverRoutes)
    }

    serverRouter!.push(req.url)
    await serverRouter.isReady()
    const { matched } = serverRouter.currentRoute.value
    const route = matched[0]
    if (route.name === '404') {
      return next()
    }
    const mod = await route.meta.load()
    mod.default(req, res, next)
  })

  server.use(async (req, res, next) => {
    if (req.method !== 'GET') {
      return next()
    }

    const isPreloadRequest = req.path.endsWith('.preload.json')
    if (isPreloadRequest) {
      req.url = req.url.replace(/(\/index)?\.preload\.json/, '')
      if (req.url[0] !== '/') {
        req.url = `/${req.url}`
      }
    }
    const result = await render({
      url: req.url,
      req,
      res,
      ssrManifest,
      serverEntry,
      isPreloadRequest,
      dotReamDir,
      scripts,
      styles,
      exportInfo,
    })

    res.statusCode = result.statusCode

    for (const key in result.headers) {
      res.setHeader(key, result.headers[key])
    }
    res.send(result.body)

    // Cache files
    writeCacheFiles(result.cacheFiles).catch(console.error)
  })

  server.onError(async (err, req, res, next) => {
    if (ctx.ssrFixStacktrace) {
      ctx.ssrFixStacktrace(err)
    }
    console.error('server error', err.stack)

    try {
      res.statusCode =
        !res.statusCode || res.statusCode < 400 ? 500 : res.statusCode
      const router = serverEntry.createClientRouter()
      router.push(req.url)
      await router.isReady()
      const ErrorComponent = await serverEntry.ErrorComponent.__asyncLoader()
      const globalPreload = await serverEntry.getGlobalPreload()
      const preloadResult = await getPreloadData(
        globalPreload,
        [ErrorComponent],
        {
          req,
          res,
          params: req.params,
        }
      )
      preloadResult.error = {
        statusCode: res.statusCode,
        stack: ctx.dev ? err.stack : undefined,
      }
      const html = await renderToHTML({
        params: req.params,
        path: req.path,
        url: req.url,
        req,
        res,
        router,
        preloadResult,
        serverEntry,
        ssrManifest,
        scripts,
        styles,
      })
      res.setHeader('content-type', 'text-html')
      res.end(html)
    } catch (error) {
      res.statusCode = 500
      res.send(
        ctx.dev
          ? `<h1>Error occurs while rendering error page:</h1><pre>${error.stack}</pre>`
          : 'server error'
      )
    }
  })

  return server.handler
}
