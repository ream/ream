import Config from 'webpack-chain'
import { Ream } from '../'
import webpack, { Compiler } from 'webpack'
import CssExtractPlugin from 'mini-css-extract-plugin'
import Webpackbar from 'webpackbar'
import consola from 'consola'

export function getWebpackConfig(
  { type }: { type: 'client' | 'server' },
  ream: Ream
) {
  const config = new Config()

  config.mode(ream.dev ? 'development' : 'production')

  if (type === 'server') {
    config.devtool('source-map')
  }

  config.entry(type).add(ream.resolveAppDir(`${type}-entry.js`))

  if (ream.dev && type === 'client') {
    config.entry('client').add(require.resolve('webpack-hot-middleware/client'))
    config.plugin('hmr').use(webpack.HotModuleReplacementPlugin)
  }

  const __PUBLIC_URL__ = '/'

  config.output
    .path(ream.resolveBuildDir(type))
    .filename(ream.dev ? '_ream/[name].js' : '_ream/[name].[chunkhash:6].js')
    .publicPath(__PUBLIC_URL__)

  config.resolve.alias
    .set('vue$', require.resolve('vue/dist/vue.esm'))
    .set('#build', ream.resolveBuildDir())
    .set('#app', ream.resolveAppDir())
    .set('~', ream.resolveRootDir())

  config.module
    .rule('vue')
    .test(/\.vue$/)
    .use('vue-loader')
    .loader(require.resolve('vue-loader'))
    .options({})

  config.module
    .rule('js')
    .test([/\.js$/, /\.ts$/])
    .include.add((filepath: string) => {
      return !filepath.includes('node_modules')
    })
    .end()
    .use('babel-loader')
    .loader(require.resolve('./babel-loader'))
    .options({
      customLoaderOptions: {
        cwd: ream.dir,
        buildDir: ream.resolveBuildDir(),
        shouldCache: false, // TODO: enable cache in the future
        type,
      }
    })

  const cssRule = config.module.rule('css').test(/\.css$/)

  if (type === 'client') {
    cssRule
      .use('css-extract')
      .loader(CssExtractPlugin.loader)
      .options({
        hmr: ream.dev,
      })
  }

  cssRule
    .use('css-loader')
    .loader(require.resolve('css-loader'))
    .options({
      sourceMap: ream.dev,
      onlyLocals: type === 'server',
    })
    .end()
    .use('postcss-loader')
    .loader(require.resolve('@egoist/postcss-loader'))

  if (type === 'client') {
    config.plugin('css-extract').use(CssExtractPlugin, [
      {
        filename: ream.dev
          ? '_ream/assets/css/[name].css'
          : '_ream/assets/css/[name].[chunkhash:6].css',
        chunkFilename: ream.dev
          ? '_ream/assets/css/[name].chunk.css'
          : '_ream/assets/css/[name].[chunkhash:6].chunk.css',
      },
    ])
  }

  if (type === 'client') {
    config.plugin('vue-ssr').use(require(`vue-server-renderer/client-plugin`), [
      {
        filename: '../client-manifest.json',
      },
    ])
  } else {
    config.plugin('vue-ssr').use(require(`vue-server-renderer/server-plugin`), [
      {
        filename: '../server-bundle.json',
      },
    ])
  }

  if (type === 'server') {
    config.target('node')
    config.output.libraryTarget('commonjs2')

    const externals = config.get('externals') || []
    config.externals(
      externals.concat([
        require('webpack-node-externals')({
          whitelist: [/\.(?!(?:jsx?|json)$).{1,5}(\?.+)?$/i],
        }),
      ])
    )

    config.node.merge({
      __filename: true,
      __dirname: true,
    })
  }

  if (ream.dev) {
    config.plugin('timefix')
  .use(require('time-fix-plugin'))
  }

  config.plugin('constants').use(webpack.DefinePlugin, [
    {
      'process.browser': JSON.stringify(type === 'client'),
      __PORT__: JSON.stringify(ream.port),
      __PUBLIC_URL__: JSON.stringify(__PUBLIC_URL__),
      __REAM_BUILD_DIR__: type === 'server' ? JSON.stringify(ream.resolveBuildDir()) : ''
    },
  ])

  config.plugin('vue').use(require('vue-loader/lib/plugin'))

  if (!ream.dev) {
    config
      .plugin('minify-css')
      .use(require('optimize-css-assets-webpack-plugin'))
  }

  config.plugin('webpackbar')
  .use(Webpackbar, [{
    name: type,
    color: type === 'client' ? 'magenta' : 'aqua'
  }])

  config.plugin('display-stats').use(
    class {
      apply(compiler: Compiler) {
        compiler.hooks.done.tap('display-stats', stats => {
          if (stats.hasErrors()) {
            consola.error(`Errors in ${type} build`, stats.toString({
              hash: false,
              entrypoints: false,
              version: false,
              builtAt: false,
              timings: false,
              colors: true,
              chunks: false,
              modules: false,
              children: false,
              chunkModules: false,
              assets: false
            }))
          }
        })
      }
    }
  )

  return config.toConfig()
}
