import WebpackChain from 'webpack-chain'
import { Ream } from 'ream/src/node'

export function useBabel(api: Ream, chain: WebpackChain, isClient: boolean) {
  const transpileDirs = [
    api.resolveVueApp(),
    ...api.plugins.map((plugin) => plugin.pluginDir),
  ]

  chain.module
    .rule('js')
    .test([/\.jsx?$/, /\.tsx?$/])
    .include.add((filepath) => {
      if (transpileDirs.some((dir) => filepath.startsWith(dir))) {
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
        isDev: api.isDev,
        cwd: api.resolveRoot(),
        buildDir: api.resolveDotReam(),
        shouldCache: api.shouldCache,
        routesDir: api.resolveRoot('routes'),
      },
    })
}
