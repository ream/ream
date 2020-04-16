import { DefinePlugin } from 'webpack'
import WebpackChain from 'webpack-chain'
import { Ream } from 'ream/src'

export function defineConstants(
  api: Ream,
  chain: WebpackChain,
  isClient: boolean
) {
  chain.plugin('constants').use(DefinePlugin, [
    {
      'process.browser': JSON.stringify(isClient),
      'process.server': JSON.stringify(!isClient),
      __REAM_BUILD_TARGET__: JSON.stringify(api.target),
      __REAM_BUILD_DIR__: JSON.stringify(api.resolveDotReam()),
      __DEV__: JSON.stringify(api.isDev),
    },
  ])
}
