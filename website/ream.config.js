/** @type {import('ream').ReamConfig} */
module.exports = {
  plugins: [
    [
      '@ream/plugin-google-analytics',
      {
        trackingId: 'UA-54857209-24',
      },
    ],
    './plugin'
  ],
}
