// @ts-check
const path = require('path')

/** @returns {import('ream').ReamPlugin}  */
module.exports = () => {
  return {
    name: 'google-analytics',

    prepare() {
      this.ensureEnv('REAM_GA_TRACKING_ID')
    },

    enhanceAppFiles() {
      return [path.join(__dirname, 'enhance-app.js')]
    },
  }
}
