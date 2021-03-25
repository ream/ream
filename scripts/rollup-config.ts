import path from 'path'
import colors from 'chalk'
import { InputOption, RollupOptions, Plugin, ExternalOption } from 'rollup'
import nodeResolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import json from '@rollup/plugin-json'
import dts from 'rollup-plugin-dts'
import tsResolve from '@egoist/rollup-plugin-ts-resolve'
import table from 'text-table'

const pkg = require(path.resolve('package.json'))
const deps = [
  'vite',
  'ream',
  'dot-ream',
  ,
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]
const external: ExternalOption = (source) => {
  const isDep = deps.some(
    (dep) => source === dep || source.startsWith(`${dep}/`)
  )
  return isDep
}

const statsPlugin = (label: string): Plugin => {
  return {
    name: 'stats',

    buildStart() {
      console.log(colors.inverse.cyan(` ${label} `))
    },

    generateBundle(_, bundle) {
      const items: string[][] = []
      for (const key of Object.keys(bundle)) {
        const file = bundle[key]
        if (file.type === 'chunk') {
          items.push([
            colors.bold(key),
            colors.green(`${file.code.length / 1000}KB`),
          ])
        }
      }
      console.log(table(items))
    },
  }
}

export const createConfig = (options: {
  label: string
  input: InputOption
  format: 'cjs' | 'esm'
  ext?: '.cjs' | '.mjs' | '.js'
  outDir?: string
  target?: 'es2018' | 'es2019' | 'es2020'
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
    plugins: [
      json(),
      esbuild({ target: options.target || 'es2018' }),
      nodeResolve(),
      statsPlugin(options.label),
      // {
      //   name: 'replace-dot-ream',
      //   renderChunk(code) {
      //     return code.replace(/dot-ream\//g, '/.ream/')
      //   },
      // },
    ],
    external,
  }
}

export const createDtsConfig = (options: {
  label: string
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
    plugins: [tsResolve(), dts(), statsPlugin(options.label)],
    external,
  }
}
