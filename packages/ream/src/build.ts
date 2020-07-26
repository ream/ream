import { Ream } from './node'
import { getWebpackConfig } from './webpack/get-webpack-config'
import webpack from 'webpack'

function runCompiler(compiler: webpack.Compiler) {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) return reject(err)
      resolve(stats)
    })
  })
}

export async function build(api: Ream) {
  const clientConfig = getWebpackConfig('client', api)
  const serverConfig = getWebpackConfig('server', api)
  const clientCompiler = webpack(clientConfig)
  const serverCompiler = webpack(serverConfig)

  await Promise.all([runCompiler(clientCompiler), runCompiler(serverCompiler)])
}
