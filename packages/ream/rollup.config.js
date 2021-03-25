// @ts-check
import 'sucrase/register'
import { createConfig, createDtsConfig } from 'scripts/rollup-config'

export default [
  // node
  createConfig({
    label: 'ream:node',
    input: {
      index: './src/node/index.ts',
      cli: './src/node/cli.ts',
      server: './src/node/server/index.ts',
    },
    format: 'cjs',
    outDir: './dist/node',
  }),
  // app
  createConfig({
    label: 'ream:app',
    input: {
      index: './src/app/index.ts',
      'server-entry': './src/app/server-entry.js',
      'client-entry': './src/app/client-entry.js',
    },
    format: 'esm',
    outDir: './dist/app',
  }),
  // dts
  createDtsConfig({
    label: 'ream:dts',
    input: {
      'app/index': './src/app/index.ts',
      'node/index': './src/node/index.ts',
      'node/server': './src/node/server/index.ts',
    },
    outDir: './dist',
  }),
]
