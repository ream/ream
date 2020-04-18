import WebpackChain from 'webpack-chain'
import { ServerPlugin } from '@ream/vue-server-renderer/dist/server-plugin'
import { ClientPlugin } from '@ream/vue-server-renderer/dist/client-plugin'

export function useVue(chain: WebpackChain, isClient: boolean) {
  chain.module
    .rule('vue')
    .test(/\.vue$/)
    .use('vue-loader')
    .loader(require.resolve('vue-loader'))
    .options({})

  chain.plugin('vue').use(require('vue-loader').VueLoaderPlugin)

  if (isClient) {
    chain.plugin('ream-client-manifest').use(ClientPlugin, [
      {
        filename: '../ream-client-manifest.json',
      },
    ])
  } else {
    chain.plugin('ream-server-bundle').use(ServerPlugin, [
      {
        filename: '../ream-server-bundle.json',
        exclude: ['ream-server.js'],
      },
    ])
  }
}
