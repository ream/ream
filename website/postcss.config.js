const { join } = require('path')

const purgecss =
  process.env.NODE_ENV === 'production' &&
  require('@fullhuman/postcss-purgecss')({
    // Specify the paths to all of the template files in your project
    content: [join(__dirname, './components/**/*.vue'), join(__dirname, './routes/**/*.vue')],
    defaultExtractor(content) {
      const contentWithoutStyleBlocks = content.replace(
        /<style[^]+?<\/style>/gi,
        ''
      )
      return (
        contentWithoutStyleBlocks.match(/[\w-/:]+(?<!:)/g) || []
      )
    },

    whitelist: ['blockquote', 'body', 'html', 'pre', 'code'],
    whitelistPatterns: [
      /-(leave|enter|appear)(|-(to|from|active))$/,
      /^(?!(|.*?:)cursor-move).+-move$/,
      /^router-link(|-exact)-active$/,
    ],
    whitelistPatternsChildren: [
      /rich-text/
    ]
  })

module.exports = {
  plugins: [
    require('tailwindcss')({
      config: join(__dirname, 'tailwind.config.js'),
    }),
    purgecss,
  ].filter(Boolean),
}
