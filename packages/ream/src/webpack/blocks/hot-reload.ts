import { HotModuleReplacementPlugin } from 'webpack'
import { Ream } from 'ream/src'
import WebpackChain from 'webpack-chain'

export function setHotReloading(
  api: Ream,
  chain: WebpackChain,
  isClient: boolean
) {
  if (isClient && api.isDev) {
    chain.plugin('hmr').use(HotModuleReplacementPlugin)
  }
}
