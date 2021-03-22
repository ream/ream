import path from 'path'
import fs from 'fs-extra'
import { Ream } from '../'
import { InlineConfig as ViteConfig, Plugin } from 'vite'

const reamAliasPlugin = (api: Ream): Plugin => {
  return {
    name: `ream:alias`,

    resolveId(source) {
      // Bundle @ream/app since it's written in esnext modules
      // Otherwise it will break in Node.js (SSR)
      // if (source === '@ream/vue') {
      //   return require.resolve(source)
      // }
      return undefined
    },
  }
}

// TODO: see if it can be fixed over https://github.com/vitejs/vite/issues/2274
const reamForceServerUpdatePlugin = (api: Ream): Plugin => {
  return {
    name: `ream:force-server-update`,

    handleHotUpdate(ctx) {
      const { moduleGraph } = api.viteServer!
      for (const [key, value] of moduleGraph.fileToModulesMap.entries()) {
        if (!key.includes('node_modules')) {
          for (const mod of value) {
            moduleGraph.invalidateModule(mod)
          }
        }
      }
    },
  }
}

const moveManifestPlugin = (manifestDir: string): Plugin => {
  return {
    name: 'ream:move-manifest',

    async writeBundle(options, bundle) {
      const files = []
      for (const file in bundle) {
        const value = bundle[file]
        if (
          file === 'manifest.json' ||
          (file === 'ssr-manifest.json' && value.type === 'asset')
        ) {
          files.push({
            name: file === 'manifest.json' ? 'client-manifest.json' : file,
            originalPath: path.join(options.dir!, file),
            // @ts-ignore
            content: value.source,
          })
          delete bundle[file]
        }
      }
      if (files.length > 0) {
        await Promise.all(
          files.map(async (file) => {
            await fs.remove(file.originalPath)
            await fs.outputFile(
              path.join(manifestDir, file.name),
              file.content,
              'utf8'
            )
          })
        )
      }
    },
  }
}

export const getViteConfig = (api: Ream, server?: boolean) => {
  const ssrManifest = !server && !api.isDev
  const entry = api.isDev
    ? undefined
    : server
    ? api.store.state.apiRoutes.reduce(
        (res, route) => {
          return {
            ...res,
            ['api/' + route.name]: route.file,
          }
        },
        { 'server-exports': api.resolveDotReam('generated/server-exports.js') }
      )
    : {
        client: './index.html',
      }

  const config: ViteConfig = {
    mode: api.mode,
    root: api.rootDir,
    configFile: false,
    plugins: [
      reamAliasPlugin(api),
      reamForceServerUpdatePlugin(api),
      moveManifestPlugin(api.resolveDotReam('manifest')),
    ],
    define: api.constants,
    resolve: {
      alias: {
        '@': api.resolveSrcDir(),
        'dot-ream': api.resolveDotReam(),
      },
    },
    optimizeDeps: {
      // Don't let Vite optimize these deps with esbuild
      exclude: ['@ream/fetch', 'node-fetch', '@vue/server-renderer'],
    },
    // @ts-expect-error
    ssr: {},
    server: {
      middlewareMode: true,
      hmr: api.config.hmr && {
        host: api.config.hmr.host,
        port: api.config.hmr.port,
      },
    },
    build: {
      minify: !api.isDev && !process.env.DEBUG,
      outDir: server
        ? api.resolveDotReam('server')
        : api.resolveDotReam('client'),
      ssrManifest,
      ssr: server,
      manifest: !api.isDev && !server,
      rollupOptions: entry
        ? {
            input: entry,
          }
        : {},
    },
  }

  for (const plugin of api.plugins) {
    if (plugin.plugin.vite) {
      plugin.plugin.vite.call(plugin.context, config)
    }
  }

  if (api.config.vite) {
    api.config.vite(config, { dev: api.isDev })
  }

  return config
}
