import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import builtins from 'builtins'

const builtinModules = builtins()

/** @type {import('rollup').RollupOptions} */
const config = {
  input: {
    index: 'src/index.ts',
  },
  output: {
    dir: 'dist',
    format: 'cjs',
  },
  plugins: [
    {
      resolveId(source) {
        if (builtinModules.includes(source)) {
          return false
        }
        return null
      }
    },
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          module: 'esnext',
        },
      },
    }),
    commonjs({
      namedExports: {
        'sirv': ['default']
      }
    })
  ]
}

export default config
