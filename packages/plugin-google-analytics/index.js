// @ts-check
const { join } = require('path')

/**
 * @param {import('./').Options} options
 * @returns {import('ream').ReamPlugin}
 */
module.exports = ({ trackingId, anonymizeIp }) => {
  return {
    name: 'Google Analytics',

    apply(api) {
      if (!trackingId) {
        throw new Error(`missing option "trackingId"`)
      }
      api.defineConstant('import.meta.env.GA_TRACKING_ID', trackingId)
      api.defineConstant('import.meta.env.GA_ANONYMIZE_IP', anonymizeIp)
      api.addPluginFile('enhance-app', join(__dirname, 'enhance-app.js'))
    },
  }
}
