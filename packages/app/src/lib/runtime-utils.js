// Used in vue-app runtime
// Be careful to import Node.js modules!

export function getPreloadPath(path) {
  path = path.replace(/\/$/, '') || 'index'
  return path + '.preload.json'
}
