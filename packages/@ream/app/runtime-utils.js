// Used in vue-app runtime
// Be careful to import Node.js modules!

export function getPreloadPath(path) {
  return /\/$/.test(path) ? `${path}index.preload.json` : `${path}.preload.json`
}
