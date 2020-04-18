import { join } from 'path'
import { Route } from '@ream/common/dist/route'
import { rankRoute } from './rank-routes'
import { normalizePath } from './normalize-path'

const matchApiRoute = (filepath: string) => {
  // **/*.xxx.{js,ts}
  if (/\.[a-zA-Z0-9]+\.(js|ts)$/.test(filepath)) {
    return true
  }
  if (filepath.startsWith('api/') && /\.(js|ts)$/.test(filepath)) {
    return true
  }
  return false
}

/**
 * Convert file paths to routes
 */
export function pathToRoutes(filepaths: string[], pagesDir: string): Route[] {
  return [...filepaths].map((file, index) => {
    return pathToRoute(file, pagesDir, index)
  })
}

export function pathToRoute(file: string, pagesDir: string, index: number) {
  file = normalizePath(file)
  const routePath = `/${file
    // Dynamic param, e.g. `[slug]` -> `:slug`
    .replace(/\[([^\]\.]+)\]/g, ':$1')
    // Call all route: e.g. `post/[...slug]` -> `/post/:slug(.*)`
    .replace(/\[\.\.\.([^\]]+)\]/, ':$1(.*)')
    // Remove extension
    .replace(/\.[a-zA-Z0-9]+$/, '')
    // Handle index route
    .replace(/^index$/, '')
    // Handle 404 route
    .replace(/^404$/, ':404(.*)')}`
  const entryName = `pages/${file.replace(/\.[a-zA-Z0-9]+$/, '')}`
  const isRoute = !file.startsWith('_') && !file.includes('_/')
  const isApiRoute = isRoute && matchApiRoute(file)
  const isClientRoute = isRoute && !matchApiRoute(file)
  return {
    routePath,
    entryName,
    absolutePath: normalizePath(join(pagesDir, file)),
    relativePath: file,
    isClientRoute,
    isApiRoute,
    is404: routePath === '/:404(.*)',
    score: rankRoute(routePath),
    index,
  }
}
