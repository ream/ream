import path from 'path'
import NODE_FS from 'fs'
import { Endpoint, Route } from '../'
import { normalizePath } from './normalize-path'

type FileItem = {
  /** Absolute path */
  path: string
  relativePath: string
  /** Relative path without extension */
  slug: string
  isDir: boolean
  /** basename of `path` without extension */
  basename: string
}

const removeExt = (p: string) => p.replace(/\.[a-z0-9]+$/i, '')

type Fs = {
  readdirSync: (dir: string) => string[]
  statSync: (filepath: string) => NODE_FS.Stats
}

export class RoutesLoader {
  constructor(private dir: string, private fs: Fs = NODE_FS) {}

  extRe = /\.(vue|ts|tsx|js|jsx)$/

  readDir(dir: string): FileItem[] {
    return this.fs.readdirSync(dir).map((name) => {
      const file = normalizePath(path.join(dir, name))
      const stat = this.fs.statSync(file)
      const relativePath = normalizePath(path.relative(this.dir, file))
      return {
        path: file,
        relativePath,
        basename: removeExt(name),
        slug: removeExt(relativePath),
        isDir: stat.isDirectory(),
      }
    })
  }

  walk(
    dir: string,
    parentPath: string,
    endpoints: Endpoint[] = []
  ): {
    pages: Route[]
    endpoints: Endpoint[]
    notFoundFile?: string
    errorFile?: string
  } {
    const files = this.readDir(dir)

    let errorFile: string | undefined
    let notFoundFile: string | undefined
    let layout: Route | undefined
    let pages: Route[] = []

    files.forEach((file) => {
      if (!file.isDir && !this.extRe.test(file.relativePath)) return

      if (file.slug === '_error') {
        errorFile = file.path
        return
      }

      if (file.slug === '404') {
        notFoundFile = file.path
        return
      }

      const isLayout = file.basename === '_layout'
      if (!isLayout && file.basename[0] === '_') return

      let path = file.basename === 'index' || isLayout ? '' : file.basename
      path = path
        .replace(/\[([^\]]+)\]/g, ':$1')
        .replace(/\[\.{3}([^\]]+)\]/, ':$1')

      if (path) {
        if (parentPath === '/') {
          path = parentPath + path
        } else {
          path = parentPath + '/' + path
        }
      } else {
        path = parentPath
      }

      if (file.isDir) {
        this.walk(file.path, path, endpoints).pages.forEach((page) =>
          pages.push(page)
        )
        return
      }

      const route: Route = {
        name: file.slug,
        path,
        isEndpoint: /\.[jt]s$/.test(file.relativePath),
        file: file.path,
      }

      if (route.isEndpoint) {
        endpoints.push(route as Endpoint)
        return
      }

      if (file.basename === '_layout') {
        layout = route
      } else {
        pages.push(route)
      }
    })

    if (layout) {
      layout.children = pages.map((page) => {
        page.path = page.path.replace(layout!.path, '').replace(/^\//, '')
        return page
      })
      pages = [layout]
    }

    return { errorFile, notFoundFile, pages, endpoints }
  }

  load() {
    return this.walk(this.dir, '/')
  }
}

export const createRoutesLoader = (dir: string, fs?: Fs) =>
  new RoutesLoader(dir, fs)
