import path from 'path'
import babelLoader from 'babel-loader'
import { loader } from 'webpack'
import consola from 'consola'

// increment '0' to invalidate cache
const CACHE_KEY = `babel-cache-0`

export default babelLoader.custom((babel: any) => {
  const configs = new Set()

  return {
    customOptions(opts: any) {
      const custom = opts.customLoaderOptions
      const filename = path.join(custom.cwd, 'noop.js')
      const loader = Object.assign(
        custom.shouldCache
          ? {
              cacheCompression: false,
              cacheDirectory: path.join(
                custom.buildDir,
                'cache',
                'ream-babel-loader'
              ),
              cacheIdentifier: JSON.stringify({
                key: CACHE_KEY,
                isClient: custom.isClient,
                buildTarget: custom.buildTarget,
                config: babel.loadPartialConfig({
                  filename,
                  cwd: custom.cwd,
                  sourceFileName: filename,
                }).options,
              }),
            }
          : {},
        opts
      )
      delete loader.customLoaderOptions

      return { loader, custom }
    },
    config(this: loader.LoaderContext, cfg: any, { customOptions }: any) {
      const filename = this.resourcePath
      const options = Object.assign({}, cfg.options)

      options.presets = options.presets || []
      options.plugins = options.plugins || []

      if (cfg.hasFilesystemConfig()) {
        for (const file of [cfg.babelrc, cfg.config]) {
          if (file && !configs.has(file)) {
            configs.add(file)
            consola.debug(`Applying Babel config file ${file}`)
          }
        }
      }

      // Replace ssr exports for pages in client build
      if (
        customOptions.isClient &&
        filename.startsWith(customOptions.pagesDir)
      ) {
        options.plugins.push([
          require.resolve('../../babel/plugins/page-exports-transforms'),
          {
            buildTarget: customOptions.buildTarget
          },
        ])
      }

      options.presets.unshift(
        babel.createConfigItem(
          [
            require('../../babel/preset'),
            {
              isServer: !customOptions.isClient,
            },
          ],
          {
            type: 'preset',
          }
        )
      )

      return options
    },
  }
})
