import { resolve, join, dirname, relative } from 'path'
import type { SetRequired } from 'type-fest'
import { ViteDevServer, UserConfig as ViteConfig } from 'vite'
import resolveFrom from 'resolve-from'
import consola from 'consola'
import { loadConfig } from './utils/load-config'
import { loadPlugins } from './load-plugins'
import { PluginContext } from './plugin-context'
import { createServer } from 'http'
import { remove, existsSync } from 'fs-extra'
import { OWN_DIR } from './utils/constants'
import { ReamPlugin } from './types'

export interface Options {
  rootDir?: string
  srcDir?: string
  dev?: boolean
  host?: string
  port?: number
}

export type ReamConfig = {
  env?: {
    [envName: string]: string | number | boolean
  }
  plugins?: Array<ReamPlugin>
  modules?: string[]
  imports?: string[]
  hmr?: {
    host?: string
    port?: number
  }
  vue?: {
    runtimeTemplateCompiler?: boolean
  }
  vite?: (viteConfig: ViteConfig, opts: { dev: boolean; ssr?: boolean }) => void
}

export const defineReamConfig = (config: ReamConfig) => config

export class Ream {
  rootDir: string
  srcDir: string
  isDev: boolean
  config: SetRequired<ReamConfig, 'env' | 'plugins' | 'imports'>
  configPath?: string
  pluginContext: PluginContext
  viteDevServer?: ViteDevServer
  serverOptions: { host: string; port: number }

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
    this.pluginContext = new PluginContext(this)
    this.serverOptions = {
      host: options.host || 'localhost',
      port: options.port || 3000,
    }

    process.env.PORT = `${this.serverOptions.port}`

    const { data: projectConfig = {}, path: configPath } = loadConfig(
      this.rootDir
    )
    if (configPath) {
      consola.info(`Using config file: ${relative(process.cwd(), configPath)}`)
    }
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
    }
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
        ['templates', 'manifest', 'server', 'client', 'export', 'meta'].map(
          (name) => {
            return remove(this.resolveDotReam(name))
          }
        )
      )
    }

    // Preparing for webpack build process
    if (shouldPrepreFiles) {
      consola.info('Preparing Ream files')
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
    const { getRequestHandler } = await import('./server')
    const handler = await getRequestHandler(this)
    return handler
  }

  async serve() {
    const handler = await this.getRequestHandler()
    const server = createServer(handler)
    const { host, port } = this.serverOptions
    server.listen(port, host)
    console.log(`> http://${host}:${port}`)
    return server
  }

  async build({
    fullyExport,
    standalone,
  }: {
    fullyExport?: boolean
    standalone?: boolean
  }) {
    await this.prepare({ shouldCleanDir: true, shouldPrepreFiles: true })
    const { build, buildStandalone } = await import('./build')
    await build(this)
    // Export static pages
    const { exportSite } = await import('./export')
    await exportSite(this.resolveDotReam(), fullyExport)
    if (standalone) {
      await buildStandalone(this)
    }
  }
}

export * from './types'
