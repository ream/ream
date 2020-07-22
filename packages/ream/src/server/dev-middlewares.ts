import { Ream } from '..'
import webpack from 'webpack'
import createDevMiddleware from 'webpack-dev-middleware'
import createHotMiddleware from 'webpack-hot-middleware'
import { getWebpackConfig } from '../webpack/get-webpack-config'
import { ReamServerHandler } from './server'

export function createDevMiddlewares(api: Ream): ReamServerHandler[] {
  const clientConfig = getWebpackConfig('client', api)
  const clientCompiler = webpack(clientConfig)

  const serverConfig = getWebpackConfig('server', api)
  const serverCompiler = webpack(serverConfig)
  const watching = serverCompiler.watch({}, () => {})

  const devMiddleware = createDevMiddleware(clientCompiler, {
    publicPath: clientConfig.output!.publicPath!,
    logLevel: 'silent',
    writeToDisk(filepath) {
      return /manifest\/ream-client-manifest.json$/.test(filepath)
    },
  })

  const hotMiddleware = createHotMiddleware(clientCompiler, {
    log: false,
  })

  api.invalidate = () => {
    watching.invalidate()
  }

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
