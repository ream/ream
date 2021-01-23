export function getOutputServerPreloadPath(path: string) {
  return /\/$/.test(path)
    ? `${path}index.serverpreload.json`
    : `${path}.serverpreload.json`
}

export function getOutputHTMLPath(path: string) {
  return path.endsWith('.html')
    ? path
    : `${path.endsWith('/') ? path.slice(0, -1) : path}/index.html`
}
