import { Key, pathToRegexp } from 'path-to-regexp'
import { Route } from './route'

function exec(path: string, regexp: RegExp, keys: Key[]) {
  let i = 0
  const out: { [k: string]: string } = {}
  const matches = regexp.exec(path)
  if (matches) {
    while (i < keys.length) {
      const name = keys[i].name
      const value = matches[++i]
      if (value !== undefined) {
        out[name] = value
      }
    }
  }
  return out
}

export function findMatchedRoute(routes: Route[], path: string) {
  for (const route of routes) {
    if (route.isClientRoute || route.isApiRoute) {
      const keys: Key[] = []
      const regexp = pathToRegexp(route.routePath, keys)
      if (regexp.test(path)) {
        const params = exec(path, regexp, keys)
        return {
          params,
          route,
        }
      }
    }
  }
  return { params: {} }
}
