import WebpackChain from 'webpack-chain'

export function useProgressBar(chain: WebpackChain, isClient: boolean) {
  chain.plugin('progress').use(require('webpackbar'), [
    {
      name: isClient ? 'Client' : 'Server',
      color: isClient ? 'cyan' : 'magenta',
    },
  ])
}
