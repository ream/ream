import WebpackChain from 'webpack-chain'
import webpack from 'webpack'
import { Ream } from '../'
import { resolve, relative } from 'path'
import {
  GET_SERVER_SIDE_PROPS_INDICATOR,
  GET_STATIC_PROPS_INDICATOR,
} from '../babel/plugins/page-exports-transforms'

export function getWebpackConfig(type: 'client' | 'server', api: Ream) {
  const chain = new WebpackChain()
  const isClient = type === 'client'

  chain.mode(api.isDev ? 'development' : 'production')

  // Sourcemap is disabled in production
  if (isClient) {
    chain.devtool(api.isDev ? '#cheap-module-eval-source-map' : false)
  } else {
    chain.devtool(api.isDev ? '#source-map' : false)
  }

  chain.output.devtoolModuleFilenameTemplate(
    // Point sourcemap entries to original disk location (format as URL on Windows)
    api.isDev
      ? (info: any) => resolve(info.absoluteResourcePath).replace(/\\/g, '/')
      : (info: any) =>
          relative(api.resolveRoot(), info.absoluteResourcePath).replace(
            /\\/g,
            '/'
          )
  )

  chain.output.jsonpFunction(`reamJsonp`)

  // Add /* filename */ comments to generated require()s in the output.
  chain.output.pathinfo(api.isDev)

  chain.output.path(api.resolveDotReam(type)).publicPath('/_ream/')

  chain.resolve.merge({
    extensions: ['.js', '.ts', '.vue', '.json', '.mjs', '.wasm'],
    alias: {
      'dot-ream': api.resolveDotReam(),
    },
  })

  if (isClient && api.isDev) {
    chain.plugin('hmr').use(webpack.HotModuleReplacementPlugin)
  }

  if (!isClient) {
    chain.output.libraryTarget('commonjs2')
    chain.target('node')
    chain.externals([
      require('webpack-node-externals')({
        whitelist: [/\.(?!(?:jsx?|json)$).{1,5}$/i],
      }),
    ])
  }

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
    .loader(require.resolve('./babel-loader'))
    .options({
      customLoaderOptions: {
        type,
        cwd: api.resolveRoot(),
        buildDir: api.resolveDotReam(),
        buildTarget: api.target,
        shouldCache: api.shouldCache,
        pagesDir: api.resolveRoot('pages'),
      },
    })

  chain.plugin('timefix').use(require('time-fix-plugin'))

  chain.module
    .rule('vue')
    .test(/\.vue$/)
    .use('vue-loader')
    .loader(require.resolve('vue-loader'))
    .options({})

  chain.plugin('vue').use(require('vue-loader').VueLoaderPlugin)

  chain.module
    .rule('css')
    .test(/\.css$/)
    .use('vue-style-loader')
    .loader(require.resolve('vue-style-loader'))
    .end()
    .use('css-loader')
    .loader(require.resolve('css-loader'))
    .end()
    .use('postcss-loader')
    .loader(require.resolve('@egoist/postcss-loader'))

  if (isClient) {
    chain
      .plugin('vue-ssr-client-manifest')
      .use(require('vue-server-renderer/client-plugin'))
  }

  chain.plugin('constants').use(webpack.DefinePlugin, [
    {
      'process.browser': JSON.stringify(type === 'client'),
      'process.server': JSON.stringify(type === 'server'),
      GET_SERVER_SIDE_PROPS_INDICATOR: JSON.stringify(
        GET_SERVER_SIDE_PROPS_INDICATOR
      ),
      GET_STATIC_PROPS_INDICATOR: JSON.stringify(GET_STATIC_PROPS_INDICATOR),
      __REAM_BUILD_TARGET__: JSON.stringify(api.target),
    },
  ])

  chain.plugin('progress').use(require('webpackbar'), [
    {
      name: type,
      color: type === 'server' ? 'cyan' : 'magenta',
    },
  ])

  chain.plugin('print-errors').use(
    class PrintErrors {
      apply(compiler: webpack.Compiler) {
        compiler.hooks.done.tap('print-errors', stats => {
          if (stats.hasErrors()) {
            console.log(
              stats.toString({
                chunks: false,
                modules: false,
                children: false,
                assets: false,
                version: false,
                builtAt: false,
                colors: true,
                chunkModules: false,
              })
            )
          }
        })
      }
    }
  )

  if (!isClient) {
    chain.node.set('__dirname', true).set('__filename', true)
  }

  const config = chain.toConfig()
  config.entry = () => api.getEntry(type)

  if (process.env.DEBUG?.includes('webpack')) {
    console.log(chain.toString())
  }

  return config
}
