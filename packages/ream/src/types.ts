import WebpackChain from 'webpack-chain'

export type ChainWebpackOptions = {
  isClient: boolean
  isDev: boolean
}

export type ChainWebpack = (chain: WebpackChain, options: ChainWebpackOptions) => void