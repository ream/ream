import WebpackChain from 'webpack-chain'

export function bundleForNode(chain: WebpackChain, isClient: boolean) {
  if (isClient) {
    return
  }

  chain.output.libraryTarget('commonjs2')
  chain.target('node')
  chain.externals([
    require('webpack-node-externals')({
      whitelist: [
        /\.(?!(?:jsx?|json)$).{1,5}$/i,
        // Bundle Ream server
        'ream-server',
        (name: string) => {
          // Don't externalize ream plugins
          // They should be bundled by webpack
          if (
            name.startsWith('ream-plugin-') ||
            name.startsWith('@ream/plugin-') ||
            name.includes('/ream-plugin-')
          ) {
            return true
          }
          return false
        },
      ],
    }),
  ])

  chain.node.set('__dirname', true).set('__filename', true)
}
