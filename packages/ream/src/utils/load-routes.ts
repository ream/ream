import path from 'path'
import { normalizePath } from '../utils/normalize-path'
import { Route } from '../'

export const filesToRoutes = (files: string[], dir: string) => {
  const routes: Route[] = []
  let errorFile: string = `@ream/app/pages/_error.js`
  let appFile: string | undefined = `@ream/app/pages/_app.js`
  let notFoundFile = `@ream/app/pages/404.js`

  for (const file of files) {
    const slug = file
      // Remove extension
      .replace(/\.[a-zA-Z0-9]+$/, '')

    const pathParts = slug.split('/')
    const absolutePath = normalizePath(path.join(dir, file))

    if (slug === '_error') {
      errorFile = absolutePath
      continue
    } else if (slug === '_app') {
      appFile = absolutePath
      continue
    } else if (slug === '404') {
      notFoundFile = absolutePath
      continue
    }

    const isServerRoute = /^api[$|\/]/.test(file)
    const route: Route = {
      name: '',
      path: '',
      file: absolutePath,
      isServerRoute,
      children: undefined,
    }

    let parent = routes

    for (let i = 0; i < pathParts.length; i++) {
      let part = pathParts[i]
      const prevPart = pathParts[i - 1]
      const nextPart = pathParts[i + 1]

      if (part.startsWith('_')) {
        break
      }

      const expectedParentRouteName = route.name
      route.name += route.name ? `/${part}` : part

      part = part
        // Dynamic param, e.g. `[slug]` -> `:slug`
        .replace(/\[([^\]\.]+)\]/g, ':$1')
        // Call all route: e.g. `[...slug]` -> `:slug(.*)`
        .replace(/\[\.{3}([^\]]+)\]/, ':$1(.*)')

      // Find a parent route
      // Except for server routes
      const child =
        !route.isServerRoute &&
        parent.find(
          (parentRoute) => parentRoute.name === expectedParentRouteName
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

  return { routes, appFile, errorFile, notFoundFile }
}
