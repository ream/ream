import { Compiler } from 'webpack'
import WebpackChain from 'webpack-chain'

export function printErrors(chain: WebpackChain) {
  chain.plugin('print-errors').use(
    class PrintErrors {
      apply(compiler: Compiler) {
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
}
