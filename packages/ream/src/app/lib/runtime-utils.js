// Used in vue-app runtime
// Be careful to import Node.js modules!

export function getLoadPath(path) {
  path = path.replace(/\/$/, '') || '/index'
  return path + '.load.json'
}
