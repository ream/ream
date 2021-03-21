// @ts-check
import 'sucrase/register'
import { createConfig, createDtsConfig } from 'scripts/rollup-config'

export default [
  createConfig({
    input: {
      index: './src/index.ts',
      cli: './src/cli.ts',
      server: './src/server/index.ts',
      app: './src/app.ts',
    },
    format: 'cjs',
    outDir: 'dist/cjs',
  }),
  createConfig({
    input: {
      index: './src/index.ts',
      cli: './src/cli.ts',
      server: './src/server/index.ts',
      app: './src/app.ts',
    },
    format: 'esm',
    outDir: 'dist/esm',
  }),
  createDtsConfig({
    input: {
      index: './src/index.ts',
      server: './src/server/index.ts',
      app: './src/app.ts',
    },
    outDir: 'dist',
  }),
]
