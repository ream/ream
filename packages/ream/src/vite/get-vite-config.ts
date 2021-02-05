import { Ream } from '../node'
import { UserConfig as ViteConfig, Plugin } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
import path from 'path'
import { babelPlugin } from './plugins/babel'
import { OWN_APP_DIR } from '../utils/constants'

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

export const getViteConfig = (api: Ream): ViteConfig => {
  return {
    root: api.rootDir,
    alias: {
      '@own-app-dir': OWN_APP_DIR,
    },
    plugins: [
      reamAliasPlugin(api),
      vuePlugin({
        include: [/\.vue$/],
      }),
      babelPlugin(),
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
      minify: !api.isDev,
      outDir: api.resolveDotReam('client'),
      cssCodeSplit: false,
    },
  }
}
