import webpack from 'webpack'
import { Ream } from "..";
import {getWebpackConfig} from './getWebpackConfig'

export function createCompilers(ream: Ream) {
  const clientConfig = getWebpackConfig({ type: 'client' }, ream)
  const serverConfig = getWebpackConfig({ type: 'server' }, ream)
  const clientCompiler = webpack(clientConfig)
  const serverCompiler = webpack(serverConfig)
  return [clientCompiler, serverCompiler]
}