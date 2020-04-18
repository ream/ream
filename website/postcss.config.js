module.exports = {
  plugins: [
    require('tailwindcss')(`${__dirname}/tailwind.config.js`),
    process.env.NODE_ENV === 'production' &&
      require('@fullhuman/postcss-purgecss')({
        // Specify the paths to all of the template files in your project
        content: [
          './**/*.vue',
        ],

        whitelist: ['html', 'body'],

        // Include any special characters you're using in this regular expression
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
      }),
  ].filter(Boolean),
}
