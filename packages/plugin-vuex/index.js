// @ts-check
const path = require('path')

/** @returns {import('ream').ReamPlugin} */
module.exports = () => {
  return {
    name: 'vuex',
    apply(ctx) {
      ctx.addPluginFile('app', path.join(__dirname, 'ream.app.js'))
    },
  }
}
