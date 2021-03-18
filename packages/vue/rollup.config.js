import nodeResolve from '@rollup/plugin-node-resolve'
import sucrase from '@rollup/plugin-sucrase'
import dts from 'rollup-plugin-dts'
import glob from 'tiny-glob/sync'

/** @typedef {import('rollup').RollupOptions} Config */

const includedModules = ['vue-router', '@vueuse/head', 'mitt']

/** @type {Config} */
const jsConfig = {
  input: {
    'server-entry': './runtime/server-entry',
    'client-entry': './runtime/client-entry',
    ...glob('*', { cwd: './runtime/pages' }).reduce((res, name) => {
      return {
        ...res,
        [`pages/${name}`]: `./runtime/pages/${name}`,
      }
    }, {}),
  },
  preserveEntrySignatures: true,
  output: {
    dir: 'runtime-dist',
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
  input: './runtime/index.ts',
  output: {
    dir: 'runtime-dist',
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
