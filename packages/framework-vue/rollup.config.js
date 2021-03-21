// @ts-check
import 'sucrase/register'
import { createConfig, createDtsConfig } from 'scripts/rollup-config'

export default [
  createConfig({
    input: {
      index: './src/index.ts',
    },
    format: 'esm',
    outDir: 'dist',
  }),
  createDtsConfig({
    input: {
      index: './src/index.ts',
    },
    outDir: 'dist',
  }),
]
