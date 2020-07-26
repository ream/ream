import WebpackChain from 'webpack-chain'

export function useVue(chain: WebpackChain, isClient: boolean) {
  chain.module
    .rule('vue')
    .test(/\.vue$/)
    .use('vue-loader')
    .loader(require.resolve('vue-loader'))
    .options({})

  chain.plugin('vue').use(require('vue-loader').VueLoaderPlugin)
}
