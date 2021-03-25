// @ts-check
const path = require('path')

/** @returns {import('ream').ReamPlugin} */
module.exports = () => {
  return {
    name: 'vuex',

    enhanceAppFiles() {
      return [path.join(__dirname, 'enhance-app.js')]
    },
  }
}
