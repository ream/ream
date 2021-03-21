import path from 'path'
import { NestedRoute, Route } from '..'

export const makeNestedRoutes = (_routes: Route[]) => {
  const routes: NestedRoute[] = []

  for (const route of _routes) {
    const pathParts =
      route.path === '/' ? ['index'] : route.path.substring(1).split('/')
    route.path = ''

    let parent = routes

    route._nest_key_ = route._nest_key_ || ''

    for (let i = 0; i < pathParts.length; i++) {
      let part = pathParts[i]
      const prevPart = pathParts[i - 1]
      const nextPart = pathParts[i + 1]

      const expectedParentKey = route._nest_key_
      route._nest_key_ += route._nest_key_ ? `/${part}` : part

      // Find a parent route
      const child = parent.find(
        (parentRoute) => parentRoute._nest_key_ === expectedParentKey
      )

      if (child) {
        child.children = child.children || []
        parent = child.children
        if (part === 'index') {
          route.path = ''
        } else {
          route.path = part.replace(/^\//, '')
        }
      } else if (part === 'index') {
        if (nextPart) {
          route.path += '/index'
        } else if (prevPart) {
          route.path += ''
        } else if (!prevPart) {
          route.path += '/'
        }
      } else {
        route.path += `/${part}`
      }
    }

    parent.push(route)
  }

  return { routes }
}

export const stringifyClientRoutes = (
  routes: NestedRoute[],
  generatedDir: string
): string => {
  const stringifyRoute = (route: NestedRoute): string => `{
    name: "${route.name}",
    path: "${route.path}",
    load: () => import("${path.relative(generatedDir, route.file)}"),
    ${
      route.children && route.children.length > 0
        ? `children: ${stringifyClientRoutes(route.children, generatedDir)}`
        : ''
    }
  }`

  return `[
    ${routes.map((route) => stringifyRoute(route)).join(',\n')}
  ]`
}
