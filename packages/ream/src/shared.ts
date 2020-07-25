// Share in ream and vue-app runtime

export function getServerPreloadPath(path: string) {
  return /\/$/.test(path)
    ? `${path}index.serverpreload.json`
    : `${path}.serverpreload.json`
}
