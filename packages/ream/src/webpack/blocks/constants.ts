import { DefinePlugin } from 'webpack'
import WebpackChain from 'webpack-chain'
import { Ream } from '../../node'

export function defineConstants(
  api: Ream,
  chain: WebpackChain,
  isClient: boolean
) {
  chain.plugin('constants').use(DefinePlugin, [
    {
      ...api.store.state.constants,
      ...Object.keys(api.config.env).reduce((result, name) => {
        return {
          ...result,
          [`process.env.${name}`]: JSON.stringify(api.config.env[name]),
        }
      }, {}),
      'process.browser': JSON.stringify(isClient),
      'process.server': JSON.stringify(!isClient),
      __REAM_BUILD_DIR__: JSON.stringify(api.resolveDotReam()),
      __DEV__: JSON.stringify(api.isDev),
    },
  ])
}
