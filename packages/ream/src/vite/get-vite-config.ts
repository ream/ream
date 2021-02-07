import fs from 'fs-extra'
import { Ream } from '../node'
import { UserConfig as ViteConfig, Plugin } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
import path from 'path'
import { babelPlugin } from './plugins/babel'

const CLIENT_APP_DIR = path.join(__dirname, '../../vue-app')

const reamAliasPlugin = (api: Ream): Plugin => {
  return {
    name: `ream:alias`,

    resolveId(source) {
      if (source.startsWith('@templates/')) {
        return source.replace('@templates', api.resolveDotReam('templates'))
      }

      if (source.startsWith('@dot-ream/')) {
        return source.replace('@dot-ream', api.resolveDotReam())
      }

      if (source.startsWith('@client-app/')) {
        return source.replace('@client-app', CLIENT_APP_DIR)
      }

      if (__dirname.includes('/packages/ream/') && source.startsWith('ream/')) {
        return source.replace('ream', api.resolveOwnDir())
      }
    },
  }
}

const moveManifestPlugin = (manifestDir: string): Plugin => {
  return {
    name: 'ream:move-manifest',

    async writeBundle(_, bundle) {
      const files = []
      for (const file in bundle) {
        const value = bundle[file]
        if (
          file === 'manifest.json' ||
          (file === 'ssr-manifest.json' && value.type === 'asset')
        ) {
          files.push({
            name: file === 'manifest.json' ? 'client-manifest.json' : file,
            // @ts-ignore
            content: value.source,
          })
          delete bundle[file]
        }
      }
      if (files.length > 0) {
        await Promise.all(
          files.map(async (file) => {
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
        `@ream/vue-app/${server ? 'server-entry.js' : 'client-entry.js'}`
      )
  return {
    root: api.rootDir,
    plugins: [
      reamAliasPlugin(api),
      vuePlugin({
        include: [/\.vue$/],
      }),
      babelPlugin(),
      moveManifestPlugin(api.resolveDotReam('manifest')),
    ],
    ssr: {
      external: ['vue', 'vue-router'],
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
}
