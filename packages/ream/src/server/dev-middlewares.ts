import { Ream } from '../node'
import webpack from 'webpack'
import createDevMiddleware from 'webpack-dev-middleware'
import createHotMiddleware from 'webpack-hot-middleware'
import { getWebpackConfig } from '../webpack/get-webpack-config'
import { ReamServerHandler } from './server'

export function createDevMiddlewares(
  api: Ream,
  updateClientManifest: (clientManifest: any) => void
): ReamServerHandler[] {
  const clientConfig = getWebpackConfig('client', api)
  const clientCompiler = webpack(clientConfig)

  const serverConfig = getWebpackConfig('server', api)
  const serverCompiler = webpack(serverConfig)
  serverCompiler.watch({}, () => {})

  clientCompiler.hooks.done.tap('update-client-manifest', (stats) => {
    if (!stats.hasErrors()) {
      const assets = stats.compilation.assets
      updateClientManifest(JSON.parse(assets['client-manifest.json'].source()))
    }
  })

  const devMiddleware = createDevMiddleware(clientCompiler, {
    publicPath: clientConfig.output!.publicPath!,
    logLevel: 'silent',
  })

  const hotMiddleware = createHotMiddleware(clientCompiler, {
    log: false,
  })

  return [
    devMiddleware,
    hotMiddleware,
    (req, res, next) => {
      for (const file of Object.keys(require.cache)) {
        if (file.startsWith(api.resolveDotReam())) {
          delete require.cache[file]
        }
      }
      if (next) {
        next()
      }
    },
  ]
}
