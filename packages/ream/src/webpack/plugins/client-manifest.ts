import hash from 'hash-sum'
import { Compiler } from 'webpack'

const isJS = (file: string): boolean => /\.js(\?[^.]+)?$/.test(file)

const isCSS = (file: string): boolean => /\.css(\?[^.]+)?$/.test(file)

const uniq = (arr: string[]) => Array.from(new Set(arr))

type Options = {
  filename?: string
}

export type ClientManifest = {
  publicPath: string
  all: string[]
  initial: string[]
  async: string[]
  modules: {
    [identifier: string]: number[]
  }
}

export class ClientManifestPlugin {
  options: Required<Options>

  constructor(options: Options = {}) {
    this.options = Object.assign(
      {
        filename: 'client-manifest.json',
      },
      options
    )
  }

  apply(compiler: Compiler) {
    compiler.hooks.emit.tap('ream-client-manifest-plugin', (compilation) => {
      const stats = compilation.getStats().toJson()

      const allFiles = uniq(stats.assets!.map((a) => a.name))

      const initialFiles = uniq(
        Object.keys(stats.entrypoints!)
          .map((name) => stats.entrypoints![name].assets)
          .reduce((assets, all) => all.concat(assets), [])
          .filter((file) => isJS(file) || isCSS(file))
      )

      const asyncFiles = allFiles
        .filter((file) => isJS(file) || isCSS(file))
        .filter((file) => initialFiles.indexOf(file) < 0)

      const manifest: ClientManifest = {
        publicPath: stats.publicPath!,
        all: allFiles,
        initial: initialFiles,
        async: asyncFiles,
        modules: {},
      }

      const assetModules = stats.modules!.filter((m) => m.assets!.length)
      const fileToIndex = (file: string) => manifest.all.indexOf(file)
      stats.modules!.forEach((m) => {
        // ignore modules duplicated in multiple chunks
        if (m.chunks.length === 1) {
          const cid = m.chunks[0]
          const chunk = stats.chunks!.find((c) => c.id === cid)
          if (!chunk || !chunk.files) {
            return
          }
          const id = m.identifier.replace(/\s\w+$/, '') // remove appended hash
          const files = (manifest.modules[hash(id)] = chunk.files.map(
            fileToIndex
          ))
          // find all asset modules associated with the same chunk
          assetModules.forEach((m) => {
            if (m.chunks.some((id) => id === cid)) {
              files.push.apply(files, m.assets!.map(fileToIndex))
            }
          })
        }
      })

      const json = JSON.stringify(manifest, null, 2)
      compilation.assets[this.options.filename] = {
        source: () => json,
        size: () => json.length,
      }
    })
  }
}
