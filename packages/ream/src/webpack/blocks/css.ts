import WebpackChain, { Rule } from 'webpack-chain'
import { Ream } from 'ream/src/node'
import { getAssetFileName } from '../../utils/asset-filename'
import consola from 'consola'

export function useCSS(api: Ream, chain: WebpackChain, isClient: boolean) {
  // TODO: maybe make these options configurable
  const extractCSS = false
  const loaderOptions: any = {}
  const sourceMap = api.isDev

  const isServer = !isClient
  // Disable CSS extraction in dev mode for better build performance(?)
  const shouldExtract = extractCSS
  // if building for production but not extracting CSS, we need to minimize
  // the embbeded inline CSS as they will not be going through the optimizing
  // plugin.
  const needInlineMinification = !api.isDev && !shouldExtract
  const fileNames = getAssetFileName({ isDev: api.isDev, isClient })

  const cssnanoOptions: any = {
    safe: true,
    autoprefixer: { disable: true },
    mergeLonghand: false,
  }
  if (sourceMap) {
    cssnanoOptions.map = { inline: false }
  }

  const extractOptions = {
    filename: fileNames.css,
    chunkFilename: fileNames.css.replace(/\.css$/, '.chunk.css'),
  }

  const createCSSRule = (
    lang: string,
    test: RegExp,
    loader?: string,
    options?: any
  ) => {
    const applyLoaders = (rule: Rule | Rule<Rule>, modules: boolean) => {
      if (shouldExtract && !isServer) {
        rule
          .use('extract-css-loader')
          .loader(require('mini-css-extract-plugin').loader)
          .options({
            // only enable hot in development
            hmr: process.env.NODE_ENV === 'development',
            // if hmr does not work, this is a forceful method.
            reloadAll: true,
          })
      } else {
        rule
          .use('vue-style-loader')
          .loader(require.resolve('vue-style-loader'))
          .options({
            sourceMap,
          })
      }

      const cssLoaderOptions = Object.assign(
        {
          sourceMap,
          modules: modules
            ? {
                localIdentName: '[local]_[hash:base64:5]',
              }
            : false,
          importLoaders:
            1 + // stylePostLoader injected by vue-loader
            1 + // postcss-loader
            (needInlineMinification ? 1 : 0),
          onlyLocals: isServer && shouldExtract,
        },
        loaderOptions.css
      )

      rule
        .use('css-loader')
        .loader(require.resolve('css-loader'))
        .options(cssLoaderOptions)

      if (needInlineMinification) {
        rule
          .use('minify-inline-css')
          .loader(require.resolve('@egoist/postcss-loader'))
          .options({
            plugins: [require('cssnano')(cssnanoOptions)],
          })
      }

      rule
        .use('postcss-loader')
        .loader(require.resolve('@egoist/postcss-loader'))
        .options(
          Object.assign(
            {
              sourceMap,
              onConfigFile(configFile: string, resourcePath: string) {
                consola.debug(`Applying PostCSS chain file ${configFile} to:`)
                consola.debug(resourcePath)
              },
            },
            loaderOptions.postcss
          )
        )

      if (loader) {
        rule
          .use(loader)
          .loader(loader)
          .options(Object.assign({ sourceMap }, options))
      }
    }

    const baseRule = chain.module.rule(lang).test(test)

    // rules for <style lang="module">
    const vueModulesRule = baseRule.oneOf('vue-modules').resourceQuery(/module/)
    applyLoaders(vueModulesRule, true)

    // rules for <style>
    const vueNormalRule = baseRule.oneOf('vue').resourceQuery(/\?vue/)
    applyLoaders(vueNormalRule, false)

    // rules for *.module.* files
    const extModulesRule = baseRule
      .oneOf('normal-modules')
      .test(/\.module\.\w+$/)
    applyLoaders(extModulesRule, true)

    // rules for normal CSS imports
    const normalRule = baseRule.oneOf('normal')
    applyLoaders(normalRule, false)
  }

  if (shouldExtract && !isServer) {
    chain
      .plugin('extract-css')
      .use(require('mini-css-extract-plugin'), [extractOptions])

    const splitChunks = chain.optimization.get('splitChunks')
    chain.optimization.splitChunks({
      ...splitChunks,
      cacheGroups: {
        ...(splitChunks && splitChunks.cacheGroups),
        styles: {
          name: 'styles',
          // necessary to ensure async chunks are also extracted
          test: /\.(css|vue)$/,
          chunks: 'all',
          enforce: true,
        },
      },
    })

    if (!api.isDev) {
      const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
      chain.plugin('optimize-css').use(OptimizeCSSPlugin, [
        {
          sourceMap,
          cssnanoOptions,
        },
      ])
    }
  }

  createCSSRule('css', /\.css$/)
  createCSSRule('postcss', /\.p(ost)?css$/)

  const sassImplementation = api.localRequire('sass')
  createCSSRule(
    'scss',
    /\.scss$/,
    'sass-loader',
    Object.assign(
      {
        implementation: sassImplementation,
      },
      loaderOptions.sass
    )
  )
  createCSSRule(
    'sass',
    /\.sass$/,
    'sass-loader',
    Object.assign(
      {
        indentedSyntax: true,
        implementation: sassImplementation,
      },
      loaderOptions.sass
    )
  )

  createCSSRule('less', /\.less$/, 'less-loader', loaderOptions.less)
  createCSSRule(
    'stylus',
    /\.styl(us)?$/,
    'stylus-loader',
    Object.assign(
      {
        preferPathResolver: 'webpack',
      },
      loaderOptions.stylus
    )
  )
}
