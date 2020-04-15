import typescript from 'rollup-plugin-typescript2'

export default {
  input: {
    index: 'src/index.ts',
    'use-meta': 'src/use-meta.ts',
  },
  output: {
    dir: 'dist',
    format: 'cjs',
  },
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          module: 'esnext',
        },
      },
    }),
  ],
}
