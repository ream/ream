// https://github.com/vuejs/vue/blob/a2bff57b0d/src/server/webpack-plugin/server.js
import { Compiler } from 'webpack'

const isJS = (file: string) => /\.js($|\?)/.test(file)

type PluginOptions = {
  filename?: string
  exclude?: string[]
}

export class ServerPlugin {
  options: Required<PluginOptions>

  constructor(options: PluginOptions = {}) {
    this.options = Object.assign(
      {
        filename: 'vue-ssr-server-bundle.json',
        exclude: [],
      },
      options
    )
  }

  apply(compiler: Compiler) {
    compiler.hooks.emit.tapAsync('vue-ssr-server-plugin', (compilation, cb) => {
      const stats = compilation.getStats().toJson()
      const entryName = Object.keys(stats.entrypoints!)[0]
      const entryAssets = stats.entrypoints![entryName].assets.filter(isJS)

      if (entryAssets.length > 1) {
        throw new Error(
          `Server-side bundle should have one single entry file. ` +
            `Avoid using CommonsChunkPlugin in the server config.`
        )
      }

      const entry = entryAssets[0]
      if (!entry || typeof entry !== 'string') {
        throw new Error(
          `Entry "${entryName}" not found. Did you specify the correct entry option?`
        )
      }

      const bundle: any = {
        entry,
        files: {},
        maps: {},
      }

      for (const asset of stats.assets!) {
        if (this.options.exclude.some(v => asset.name === v)) {
          continue
        }

        if (asset.name.match(/\.js$/)) {
          bundle.files[asset.name] = compilation.assets[asset.name].source()
        } else if (asset.name.match(/\.map$/)) {
          bundle.maps[asset.name.replace(/\.map$/, '')] = JSON.parse(
            compilation.assets[asset.name].source()
          )
        }
        // do not emit anything else for server
        delete compilation.assets[asset.name]
      }

      const json = JSON.stringify(bundle, null, 2)
      const filename = this.options.filename

      compilation.assets[filename] = {
        source: () => json,
        size: () => json.length,
      }

      cb()
    })
  }
}
