import { resolve, join, dirname } from 'path'
import type { SetRequired } from 'type-fest'
import type { ViteDevServer, UserConfig as ViteConfig } from 'vite'
import resolveFrom from 'resolve-from'
import { loadConfig } from './utils/load-config'
import { loadPlugins } from './load-plugins'
import { Store, store } from './store'
import { createServer } from 'http'
import { remove, existsSync } from 'fs-extra'
import { OWN_DIR } from './utils/constants'
import { ReamPlugin } from './types'

export interface Options {
  rootDir?: string
  srcDir?: string
  dev?: boolean
  server?: {
    port?: number | string
  }
}

export type ReamConfig = {
  env?: {
    [k: string]: string | boolean | number
  }
  plugins?: Array<ReamPlugin>
  imports?: string[]
  server?: {
    port?: number
  }
  vite?: (viteConfig: ViteConfig, opts: { dev: boolean; ssr?: boolean }) => void
}

export class Ream {
  rootDir: string
  srcDir: string
  isDev: boolean
  config: SetRequired<ReamConfig, 'env' | 'plugins' | 'imports' | 'server'>
  configPath?: string
  store: Store
  viteDevServer?: ViteDevServer
  // Used by `export` command, addtional routes like server routes and *.preload.json
  exportedServerRoutes?: Set<string>

  constructor(options: Options = {}, configOverride: ReamConfig = {}) {
    this.rootDir = resolve(options.rootDir || '.')
    if (options.srcDir) {
      this.srcDir = join(this.rootDir, options.srcDir)
    } else {
      const hasPagesInSrc = existsSync(join(this.rootDir, 'src/pages'))
      this.srcDir = hasPagesInSrc ? join(this.rootDir, 'src') : this.rootDir
    }
    this.isDev = Boolean(options.dev)
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = this.isDev ? 'development' : 'production'
    }
    this.store = store

    const { data: projectConfig = {}, path: configPath } = loadConfig(
      this.rootDir
    )
    this.configPath = configPath
    this.config = {
      ...projectConfig,
      env: {
        ...projectConfig.env,
        ...configOverride.env,
      },
      plugins: [
        ...(configOverride.plugins || []),
        ...(projectConfig.plugins || []),
      ],
      imports: projectConfig.imports || [],
      server: {
        ...projectConfig.server,
        port: projectConfig.server?.port || 3000,
      },
    }
    process.env.PORT = String(this.config.server.port)
  }

  resolveRootDir(...args: string[]) {
    return resolve(this.rootDir, ...args)
  }

  resolveSrcDir(...args: string[]) {
    return resolve(this.srcDir, ...args)
  }

  resolveDotReam(...args: string[]) {
    return this.resolveRootDir('.ream', ...args)
  }

  resolveOwnDir(...args: string[]) {
    return resolve(OWN_DIR, ...args)
  }

  resolveInPackage(pkg: string, target: string) {
    const pkgDir = dirname(resolveFrom(process.cwd(), `${pkg}/package.json`))
    return resolveFrom(pkgDir, target)
  }

  async prepare({
    shouldCleanDir,
    shouldPrepreFiles,
  }: {
    shouldCleanDir: boolean
    shouldPrepreFiles: boolean
  }) {
    await loadPlugins(this)

    if (shouldCleanDir) {
      // Remove everything but cache
      await Promise.all(
        ['templates', 'manifest', 'server', 'client', 'export'].map((name) => {
          return remove(this.resolveDotReam(name))
        })
      )
    }

    // Preparing for webpack build process
    if (shouldPrepreFiles) {
      console.log('Preparing Ream files')
      const { prepareFiles } = await import('./prepare-files')
      await prepareFiles(this)
    }
  }

  localResolve(name: string) {
    return resolveFrom.silent(this.rootDir, name)
  }

  localRequire(name: string) {
    const path = this.localResolve(name)
    return path && require(path)
  }

  async getRequestHandler() {
    await this.prepare({
      shouldCleanDir: this.isDev,
      shouldPrepreFiles: this.isDev,
    })
    const { createServer } = await import('./server')
    const server = await createServer(this)
    return server
  }

  async serve() {
    const handler = await this.getRequestHandler()
    const server = createServer(handler)
    server.listen(this.config.server.port)
    console.log(`> http://localhost:${this.config.server.port}`)
    return server
  }

  async build(shouldExport?: boolean) {
    await this.prepare({ shouldCleanDir: true, shouldPrepreFiles: true })
    const { build } = await import('./build')
    await build(this)
    if (shouldExport) {
      const { exportSite } = await import('./export')
      await exportSite(this.resolveDotReam())
    }
  }
}

export * from './types'
