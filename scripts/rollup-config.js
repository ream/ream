// @ts-check
import path from 'path'
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

/** @typedef {import('rollup').InputOption} Input */

/**
 * @param {{input: Input, format: 'cjs' | 'esm', outDir?: string}} options
 * @returns {import('rollup').RollupOptions}
 */
export const createConfig = (options) => {
  const outDir = options.outDir || 'dist'
  return {
    input: options.input,
    output: {
      dir: outDir,
      format: options.format,
      entryFileNames: options.format === 'esm' ? '[name].mjs' : '[name].js',
      chunkFileNames:
        options.format === 'esm' ? '[name]-[hash].mjs' : '[name]-[hash].js',
    },
    plugins: [json(), esbuild({ target: 'es2020' }), nodeResolve()],
    external,
  }
}

/**
 * @param {{input: Input, outDir?: string}} options
 * @returns {import('rollup').RollupOptions}
 */
export const createDtsConfig = (options) => {
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
