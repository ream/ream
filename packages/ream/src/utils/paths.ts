import { getServerPreloadPath } from '../runtime-utils'

export function getOutputServerPreloadPath(path: string) {
  return getServerPreloadPath(path)
}

export function getOutputHTMLPath(path: string) {
  return path.endsWith('.html')
    ? path
    : `${path.endsWith('/') ? path.slice(0, -1) : path}/index.html`
}
