import WebpackChain from 'webpack-chain'

export function useCSS(chain: WebpackChain) {
  chain.module
    .rule('css')
    .test(/\.css$/)
    .use('vue-style-loader')
    .loader(require.resolve('vue-style-loader'))
    .end()
    .use('css-loader')
    .loader(require.resolve('css-loader'))
    .end()
    .use('postcss-loader')
    .loader(require.resolve('@egoist/postcss-loader'))
}
