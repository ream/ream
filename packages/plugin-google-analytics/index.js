// @ts-check
const path = require('path')

/** @returns {import('ream').ReamPlugin}  */
module.exports = () => {
  return {
    name: 'google-analytics',

    apply(ctx) {
      ctx.ensureEnv('REAM_GA_TRACKING_ID')

      ctx.addPluginFile('app', path.join(__dirname, 'ream.app.js'))
    },
  }
}
