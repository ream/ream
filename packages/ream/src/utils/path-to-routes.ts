import { join } from 'path'
import { rankRoute } from './rank-routes'

export type Route = {
  routePath: string
  entryName: string
  absolutePath: string
  relativePath: string
  isClientRoute: boolean
  isApiRoute: boolean
  index: number
  score: number
}

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
  return [...filepaths]
    .map((file, index) => {
      const routePath = `/${file
        // Dynamic param, e.g. `[slug]` -> `:slug`
        .replace(/\[([^\]\.]+)\]/g, ':$1')
        // Call all route: e.g. `post/[...slug]` -> `/post/:slug(.*)`
        .replace(/\[\.\.\.([^\]]+)\]/, ':$1(.*)')
        // Remove extension
        .replace(/\.[a-zA-Z0-9]+$/, '')}`.replace(/^\/index$/, '/')
      const entryName = `pages/${file.replace(/\.[a-zA-Z0-9]+$/, '')}`
      const isRoute = !file.startsWith('_') && !file.includes('_/')
      const isApiRoute = isRoute && matchApiRoute(file)
      const isClientRoute = isRoute && !matchApiRoute(file)
      return {
        routePath,
        entryName,
        absolutePath: join(pagesDir, file),
        relativePath: file,
        isClientRoute,
        isApiRoute,
        score: rankRoute(routePath),
        index,
      }
    })
    .sort((a, b) => {
      return a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
    })
}
