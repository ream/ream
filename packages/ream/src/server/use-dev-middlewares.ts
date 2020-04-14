import { Ream } from '..'
import { Express } from 'express'
import webpack from 'webpack'
import createDevMiddleware from 'webpack-dev-middleware'
import createHotMiddleware from 'webpack-hot-middleware'
import { getWebpackConfig } from  '../webpack/get-webpack-config'

export async function useDevMiddlewares(api: Ream, server: Express) {

  const clientConfig = getWebpackConfig('client', api)
  const clientCompiler = webpack(clientConfig)

  const serverConfig = getWebpackConfig('server', api)
  const serverCompiler = webpack(serverConfig)
  const watching = serverCompiler.watch({}, () => {})

  const devMiddleware = createDevMiddleware(clientCompiler, {
    publicPath: clientConfig.output!.publicPath!,
    logLevel: 'silent',
    writeToDisk(filepath) {
      return /vue-ssr-client-manifest.json$/.test(filepath)
    }
  })

  const hotMiddleware = createHotMiddleware(clientCompiler, {
    log: false
  })

  api.invalidate = () => {
    watching.invalidate()
  }

  server.use(devMiddleware)
  server.use(hotMiddleware)
}