import path from 'path'
import fs from 'fs-extra'
import { Ream, resolveOwnDir } from '../'
import { InlineConfig as ViteConfig, Plugin } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
import { babelPlugin } from './plugins/babel'

// TODO: see if it can be fixed over https://github.com/vitejs/vite/issues/2274
const reamForceServerUpdatePlugin = (api: Ream): Plugin => {
  return {
    name: `ream:force-server-update`,

    handleHotUpdate(ctx) {
      const { moduleGraph } = api.viteDevServer!
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

export const getViteConfig = (api: Ream, server?: boolean): ViteConfig => {
  const ssrManifest = !server && !api.isDev
  const entry = api.isDev
    ? undefined
    : server
    ? 'ream/dist/app/server-entry.js'
    : { client: './index.html' }

  const config: ViteConfig = {
    mode: api.mode,
    root: api.rootDir,
    configFile: false,
    plugins: [
      reamForceServerUpdatePlugin(api),
      vuePlugin({
        include: [/\.vue$/],
      }),
      babelPlugin(),
      moveManifestPlugin(api.resolveDotReam('manifest')),
      {
        name: 'inject-script-tag',
        transformIndexHtml: {
          enforce: 'pre',
          transform() {
            return [
              {
                injectTo: 'body',
                tag: 'script',
                attrs: {
                  type: 'module',
                  src: `/@fs/${resolveOwnDir('app/client-entry.js')}`,
                },
              },
            ]
          },
        },
      },
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
      exclude: ['ream/app', '@ream/fetch', 'node-fetch'],
      include: ['vue'],
    },
    // @ts-expect-error vite does not expose these experimental stuff in types yet
    ssr: {
      // https://vitejs.dev/config/#ssr-external
      external: [
        'vue',
        'vue/dist/vue.esm-bundler.js',
        'vue/dist/vue.runtime.esm-bundler.js',
      ],
      noExternal: ['ream/app', 'ream'],
    },
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

  if (api.config.vite) {
    api.config.vite(config, { dev: api.isDev })
  }

  return config
}
