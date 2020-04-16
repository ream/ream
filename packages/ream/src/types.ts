import WebpackChain from 'webpack-chain'
import { Store } from './store'

export type ChainWebpackOptions = {
  isClient: boolean
  isDev: boolean
}

export type ChainWebpack = (chain: WebpackChain, options: ChainWebpackOptions) => void

export type ReamPlugin<T = any> = {
  config?: {
    name?: string
  }
  apply?: (api: Store, options: T) => void
}