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
      ],
    }),
  ])

  chain.node.set('__dirname', true).set('__filename', true)
}
