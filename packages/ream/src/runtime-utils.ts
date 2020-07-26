// Used in vue-app runtime
// Be careful to import Node.js modules!

export function getServerPreloadPath(path: string) {
  return /\/$/.test(path)
    ? `${path}index.serverpreload.json`
    : `${path}.serverpreload.json`
}
