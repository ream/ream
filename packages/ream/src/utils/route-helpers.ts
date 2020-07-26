import { Key, pathToRegexp, compile } from 'path-to-regexp'
import { Route } from './route'

export function execPathRegexp(path: string, regexp: RegExp, keys: Key[]) {
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
    if (route.isClientRoute || route.isServerRoute) {
      const params = getParams(path, route.routePath)
      if (params) {
        return {
          params,
          route,
        }
      }
    }
  }
  return { params: {} }
}

export function getParams(path: string, pattern: string) {
  const keys: Key[] = []
  const regexp = pathToRegexp(pattern, keys)
  if (regexp.test(path)) {
    const params = execPathRegexp(path, regexp, keys)
    return params
  }
  return
}

export function compileToPath(pattern: string, params: any) {
  return compile(pattern, {
    encode: encodeURIComponent,
  })(params)
}

export { pathToRegexp } from 'path-to-regexp'

// Everything in the form of `:whatever`
const DYNAMIC_ROUTE_RE = /^:(.+)/

export function isDynamicSegment(segment: string) {
  return DYNAMIC_ROUTE_RE.test(segment)
}
