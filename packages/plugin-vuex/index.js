// @ts-check

const path = require('path')

/**
 * @returns {import('ream').ReamPlugin}
 */
module.exports = () => {
  return {
    name: `vuex`,

    apply(ctx) {
      ctx.addPluginFile('enhance-app', path.join(__dirname, 'enhance-app.js'))
    },
  }
}
