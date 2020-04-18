import typescript from 'rollup-plugin-typescript2'

export default {
  input: {
    index: 'src/index.ts',
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
