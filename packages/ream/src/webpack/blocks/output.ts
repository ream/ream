import { resolve, relative } from 'path'
import { Ream } from 'ream/src/node'
import WebpackChain from 'webpack-chain'
import { getAssetFileName } from '../../utils/asset-filename'

export function setOutput(api: Ream, chain: WebpackChain, isClient: boolean) {
  chain.output.devtoolModuleFilenameTemplate(
    // Point sourcemap entries to original disk location (format as URL on Windows)
    api.isDev
      ? (info: any) => resolve(info.absoluteResourcePath).replace(/\\/g, '/')
      : (info: any) =>
          relative(api.resolveDir(), info.absoluteResourcePath).replace(
            /\\/g,
            '/'
          )
  )

  const filenames = getAssetFileName({
    isDev: api.isDev,
    isClient,
  })
  chain.output.filename(filenames.js)

  chain.output.jsonpFunction(`reamJsonp`)

  // Add /* filename */ comments to generated require()s in the output.
  chain.output.pathinfo(api.isDev)

  chain.output
    .path(api.resolveDotReam(isClient ? 'client' : 'server'))
    .publicPath('/_ream/')
}
