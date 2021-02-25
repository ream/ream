import path from 'path'
import fs from 'fs-extra'
import { Ream } from '../'
import { UserConfig as ViteConfig, Plugin } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
import { babelPlugin } from './plugins/babel'

const reamAliasPlugin = (api: Ream): Plugin => {
  return {
    name: `ream:alias`,

    resolveId(source) {
      // Bundle @ream/app since it's written in esnext modules
      // Otherwise it will break in Node.js (SSR)
      if (source === '@ream/app' || source.startsWith('@ream/app/')) {
        return require.resolve(source)
      }
      return undefined
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
    : require.resolve(
        `@ream/app/${server ? 'server-entry.js' : 'client-entry.js'}`
      )

  const config: ViteConfig = {
    root: api.rootDir,
    plugins: [
      reamAliasPlugin(api),
      vuePlugin({
        include: [/\.vue$/],
      }),
      babelPlugin(),
      moveManifestPlugin(api.resolveDotReam('manifest')),
    ],
    define: {
      ...api.store.state.constants,
      'import.meta.env.REAM_SRC_DIR': JSON.stringify(api.resolveSrcDir()),
      'import.meta.env.REAM_ROOT_DIR': JSON.stringify(api.resolveRootDir()),
    },
    resolve: {
      alias: {
        '@': api.resolveSrcDir(),
      },
    },
    optimizeDeps: {
      // Don't let Vite optimize these deps with esbuild
      exclude: ['@ream/app', '@ream/fetch'],
      // include: ['vue', 'vue-router', '@vueuse/head'],
    },
    // @ts-expect-error vite does not expose these experimental stuff in types yet
    ssr: {
      // https://vitejs.dev/config/#ssr-external
      external: ['vue', 'vue-router'],
      noExternal: ['@ream/app'],
    },
    server: {
      middlewareMode: api.isDev,
      hmr: {
        host: 'localhost',
        port: 23818,
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
    api.config.vite(config, { dev: api.isDev, ssr: server })
  }

  return config
}
