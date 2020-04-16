import WebpackChain from 'webpack-chain'
import { Ream } from 'ream/src'

export function useBabel(api: Ream, chain: WebpackChain, isClient: boolean) {
  chain.module
    .rule('js')
    .test([/\.jsx?$/, /\.tsx?$/])
    .include.add(filepath => {
      if (filepath.startsWith(api.resolveApp())) {
        return true
      }
      if (filepath.includes('node_modules')) {
        return false
      }
      return true
    })
    .end()
    .use('babel-loader')
    .loader(require.resolve('../loaders/babel-loader'))
    .options({
      customLoaderOptions: {
        isClient,
        cwd: api.resolveRoot(),
        buildDir: api.resolveDotReam(),
        buildTarget: api.config.target,
        shouldCache: api.shouldCache,
        pagesDir: api.resolveRoot('pages'),
      },
    })
}
