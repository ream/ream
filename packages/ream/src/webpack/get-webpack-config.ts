import WebpackChain from 'webpack-chain'
import { Ream } from '../'
import { setOutput } from './blocks/output'
import { setResolve } from './blocks/resolve'
import { setHotReloading } from './blocks/hot-reload'
import { bundleForNode } from './blocks/bundle-for-node'
import { useBabel } from './blocks/babel'
import { useVue } from './blocks/vue'
import { useCSS } from './blocks/css'
import { defineConstants } from './blocks/constants'
import { useProgressBar } from './blocks/progress-bar'
import { printErrors } from './blocks/print-errors'
import { store } from '../store'
import { ChainWebpack, ChainWebpackOptions } from '../types'
import { ClientManifestPlugin } from './plugins/client-manifest'

export function getWebpackConfig(type: 'client' | 'server', api: Ream) {
  const chain = new WebpackChain()
  const isClient = type === 'client'

  chain.mode(api.isDev ? 'development' : 'production')

  // TODO: Sourcemap is currentlydisabled in production for client bundle, change if needed
  if (isClient) {
    chain.devtool(api.isDev ? 'cheap-module-eval-source-map' : false)
  } else {
    chain.devtool('source-map')
  }

  setOutput(api, chain, isClient)
  setResolve(api, chain)
  setHotReloading(api, chain, isClient)
  bundleForNode(chain, isClient)
  useBabel(api, chain, isClient)

  chain.plugin('timefix').use(require('time-fix-plugin'))

  useVue(chain, isClient)

  useCSS(api, chain, isClient)

  defineConstants(api, chain, isClient)

  useProgressBar(chain, isClient)

  printErrors(chain)

  chain.plugin('client-manifest').use(ClientManifestPlugin)

  const chainWebpackOptions: ChainWebpackOptions = {
    isClient,
    isDev: api.isDev,
  }
  for (const chainWebpackPath of store.state.pluginsFiles['chain-webpack']) {
    const chainWebpack: ChainWebpack = require(chainWebpackPath)
    chainWebpack(chain, chainWebpackOptions)
  }
  api.config.chainWebpack(chain, chainWebpackOptions)

  const config = chain.toConfig()
  // webpack-chain itself doesn't support async entry
  // so we manually set entry here
  config.entry = () => api.getEntry(isClient)

  if (process.env.DEBUG?.includes('webpack')) {
    console.log(chain.toString())
  }

  return config
}
