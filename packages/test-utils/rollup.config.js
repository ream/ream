// @ts-check
import 'sucrase/register'
import { createConfig, createDtsConfig } from 'scripts/rollup-config'

export default [
  createConfig({
    label: 'test-utils:cjs',
    input: ['./src/index.ts'],
    format: 'cjs',
  }),
  createDtsConfig({
    label: 'test-utils:dts',
    input: ['./src/index.ts'],
  }),
]
