module.exports = {
  purge: [`${__dirname}/**/*.vue`],
  theme: {
    extend: {
      colors: {
        ...require('@egoist/md-colors'),
      },
    },
  },
  variants: {},
  plugins: [],
}
