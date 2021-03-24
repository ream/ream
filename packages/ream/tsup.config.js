// @ts-check

/** @type {import('tsup').Options} */
module.exports = {
  entryPoints: ['./src/cli.ts', './src/index.ts'],
  dts: {
    entry: './src/index.ts',
    resolve: true,
  },
  clean: true,
}
