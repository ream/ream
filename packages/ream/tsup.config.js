// @ts-check

/** @type {import('tsup').Options} */
module.exports = {
  entryPoints: ['./src/cli.ts', './src/index.ts'],
  dts: {
    entry: {
      index: './src/index.ts',
      server: './src/server/index.ts',
    },
    resolve: true,
  },
  clean: true,
}
