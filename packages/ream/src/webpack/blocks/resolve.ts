import { Ream } from 'ream/src'
import WebpackChain from 'webpack-chain'

export function setResolve(api: Ream, chain: WebpackChain) {
  chain.resolve.merge({
    extensions: ['.js', '.ts', '.vue', '.json', '.mjs', '.wasm'],
    alias: {
      'dot-ream': api.resolveDotReam(),
      '@': api.resolveRoot(),
    },
  })
}
