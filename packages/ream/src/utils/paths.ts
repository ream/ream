export function getStaticPreloadOutputPath(path: string) {
  return /\/$/.test(path) ? `${path}index.preload.json` : `${path}.preload.json`
}

export function getOutputHTMLPath(path: string) {
  return path.endsWith('.html')
    ? path
    : `${path.endsWith('/') ? path.slice(0, -1) : path}/index.html`
}
