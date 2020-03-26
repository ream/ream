import { Ream } from '.'
import fs from 'fs-extra'
import webpack from 'webpack'
import createDevMiddleware from 'webpack-dev-middleware'
import createHotMiddleware from 'webpack-hot-middleware'
import { createBundleRenderer } from 'vue-server-renderer'
import { getWebpackConfig } from './webpack/getWebpackConfig'
import { createModule } from 'virtual-module'

export function getDevMiddlewares(ream: Ream) {
  const clientCompiler = webpack(
    getWebpackConfig(
      {
        type: 'client',
      },
      ream
    )
  )
  const serverCompiler = webpack(
    getWebpackConfig(
      {
        type: 'server',
      },
      ream
    )
  )

  const initRenderer = () => {
    if (ream.clientManifest && ream.serverBundle) {
      ream.bundleRenderer = createBundleRenderer(ream.serverBundle, {
        clientManifest: ream.clientManifest,
        inject: false,
        basedir: ream.dir,
        runInNewContext: false
      })
    }
    if (ream.serverBundle) {
      ream.evalueModule = createModule(ream.serverBundle.files, {
        baseDir: ream.dir,
        sandbox: false
      })
    }
  }

  clientCompiler.hooks.done.tap('get-client-manifest', async stats => {
    const clientManifest = stats.compilation.assets['../client-manifest.json']
    ream.clientManifest = JSON.parse(clientManifest.source())
    initRenderer()
  })
  serverCompiler.hooks.done.tap('get-server-bundle', async () => {
    ream.serverBundle = JSON.parse(
      await fs.readFile(
        ream.resolveBuildDir('server-bundle.json'),
        'utf8'
      )
    )
    initRenderer()
  })

  serverCompiler.watch({}, () => {})
  const devMiddleware = createDevMiddleware(clientCompiler, {
    logLevel: 'silent',
    publicPath: clientCompiler.options.output!.publicPath!
  })
  const hotMiddleware = createHotMiddleware(clientCompiler, {
    log: false
  })
  return [devMiddleware, hotMiddleware]
}
