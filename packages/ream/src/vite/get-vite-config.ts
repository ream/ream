import { Ream } from '../node'
import { UserConfig as ViteConfig, Plugin } from 'vite'
import { NodeTypes, ElementTypes } from '@vue/compiler-core'
import vuePlugin from '@vitejs/plugin-vue'
import path from 'path'

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
    plugins: [
      reamAliasPlugin(api),
      vuePlugin({
        include: [/\.vue$/],
        template: {
          compilerOptions: {
            nodeTransforms: [
              (node) => {
                if (node.type === NodeTypes.ELEMENT) {
                  if (node.props.length === 0 || node.tag !== 'a') {
                    return
                  }
                  for (const attr of node.props) {
                    if (attr.type === NodeTypes.ATTRIBUTE) {
                      if (attr.name === 'href' && attr.value) {
                        if (/^https?:\/\//.test(attr.value.content)) {
                        } else {
                          node.tagType = ElementTypes.COMPONENT
                          node.tag = 'router-link'
                          attr.name = 'to'
                        }
                        break
                      }
                    }
                  }
                }
              },
            ],
          },
        },
      }),
    ],
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
