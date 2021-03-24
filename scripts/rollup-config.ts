import path from 'path'
import { InputOption, RollupOptions } from 'rollup'
import nodeResolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import json from '@rollup/plugin-json'
import dts from 'rollup-plugin-dts'
import tsResolve from '@egoist/rollup-plugin-ts-resolve'

const pkg = require(path.resolve('package.json'))
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]

export const createConfig = (options: {
  input: InputOption
  format: 'cjs' | 'esm'
  ext?: '.cjs' | '.mjs' | '.js'
  outDir?: string
}): RollupOptions => {
  const outDir = options.outDir || 'dist'
  const ext = options.ext || '.js'
  return {
    input: options.input,
    output: {
      dir: outDir,
      format: options.format,
      entryFileNames: `[name]${ext}`,
      chunkFileNames: `[name]-[hash]${ext}`,
    },
    plugins: [json(), esbuild({ target: 'es2020' }), nodeResolve()],
    external,
  }
}

export const createDtsConfig = (options: {
  input: InputOption
  outDir?: string
}): RollupOptions => {
  const outDir = options.outDir || 'dist'
  return {
    input: options.input,
    output: {
      dir: outDir,
      format: 'esm',
    },
    plugins: [tsResolve(), dts()],
    external,
  }
}
