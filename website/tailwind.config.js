module.exports = {
  purge: [`${__dirname}/src/**/*.vue`],
  variants: {},
  plugins: [require('@tailwindcss/ui')()],
}
