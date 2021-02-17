import path from 'path'
import { Route } from './route'

export const filesToRoutes = (files: string[], dir: string) => {
  const routes: Route[] = []
  let errorFile: string = require.resolve(`@ream/vue-app/pages/_error.js`)
  let appFile: string | undefined = require.resolve(
    `@ream/vue-app/pages/_app.js`
  )
  let documentFile: string | undefined = require.resolve(
    `@ream/vue-app/pages/_document.js`
  )
  let notFoundFile = require.resolve(`@ream/vue-app/pages/404.js`)

  for (const file of files) {
    const slug = file
      // Dynamic param, e.g. `[slug]` -> `:slug`
      .replace(/\[([^\]\.]+)\]/g, ':$1')
      // Call all route: e.g. `post/[...slug]` -> `/post/:slug(.*)`
      .replace(/\[\.{3}([^\]]+)\]/, ':$1(.*)')
      // Remove extension
      .replace(/\.[a-zA-Z0-9]+$/, '')
      // Handle 404 route
      .replace(/^404$/, ':404(.*)')
    const pathParts = slug.split('/')
    const absolutePath = path.join(dir, file)

    if (slug === '_error') {
      errorFile = absolutePath
    } else if (slug === '_document') {
      documentFile = absolutePath
    } else if (slug === '_app') {
      appFile = absolutePath
    } else if (slug === '404') {
      notFoundFile = absolutePath
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
      const part = pathParts[i]
      const prevPart = pathParts[i - 1]
      const nextPart = pathParts[i + 1]

      if (part.startsWith('_')) {
        break
      }

      const expectedParentRouteName = route.name
      route.name += route.name ? `-${part}` : part

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

  return { routes, appFile, documentFile, errorFile, notFoundFile }
}
