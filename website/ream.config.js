/** @type {import('ream').ReamConfig} */
module.exports = {
  plugins: [
    [
      '@ream/plugin-google-analytics',
      {
        trackingId: 'UA-54857209-24',
      },
    ],
  ],
  css: [
    'prismjs/themes/prism-tomorrow.css',
    '/@windicss/windi.css',
    '@/css/main.css',
  ],
  vite(config) {
    config.plugins.push(require('vite-plugin-windicss').default())
  },
}
