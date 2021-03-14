import nodeResolve from '@rollup/plugin-node-resolve'
import sucrase from '@rollup/plugin-sucrase'
import dts from 'rollup-plugin-dts'
import glob from 'tiny-glob/sync'

/** @typedef {import('rollup').RollupOptions} Config */

const includedModules = ['vue-router', '@vueuse/head', 'mitt']

/** @type {Config} */
const jsConfig = {
  input: [
    './src/index.ts',
    './src/server-entry.js',
    './src/client-entry.js',
    ...glob('./src/pages/*'),
  ],
  preserveEntrySignatures: true,
  output: {
    dir: 'dist',
    format: 'esm',
  },
  plugins: [
    nodeResolve({
      resolveOnly: includedModules,
    }),
    sucrase({ transforms: ['typescript'] }),
  ],
}

/** @type {Config} */
const dtsConfig = {
  input: ['./src/index.ts'],
  output: {
    dir: 'dist',
    format: 'esm',
  },
  plugins: [
    nodeResolve({
      resolveOnly: includedModules,
      extensions: ['.ts', '.d.ts'],
      mainFields: ['types', 'typings', 'module', 'main'],
      moduleDirectories: ['node_modules/@types', 'node_modules'],
    }),
    dts(),
  ],
}

export default [jsConfig, dtsConfig]
