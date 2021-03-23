import path from 'path'
import createDebug from 'debug'
import glob from 'fast-glob'
import { ReamPlugin } from '..'

const debug = createDebug('ream:routes-plugin')

const filenameToRoutePath = (filename: string, isApi = false) => {
  let routePath =
    '/' +
    filename
      // /index -> /
      .replace(/^index$/, '')
      .replace(/\[([^\]+])\]/g, (_, p1) => {
        if (p1.startsWith('...')) {
          return `:${p1.substring(3)}(.+)`
        }
        return `:${p1}`
      })

  if (isApi) {
    routePath = routePath.replace(/\/index$/, '')
  }

  return routePath
}

const filepathToRoute = (dir: string, filepath: string, isApi = false) => {
  const filename = path
    .relative(dir, filepath)
    // Remove extension
    .replace(/\.[a-z]+$/, '')
  const routePath = filenameToRoutePath(filename, isApi)
  return {
    id: filepath,
    name: filename,
    path: routePath,
    file: filepath,
  }
}

export const routesPlugin = (): ReamPlugin => {
  const pageExtRe = /\.(jsx|tsx|js|ts|vue|svelte)$/
  const apiExtRe = /\.[jt]s$/
  let pagesDir: string
  let apiDir: string
  let pageFiles: string[] | undefined
  let apiFiles: string[] | undefined

  return {
    name: `ream:routes`,

    async getClientRoutes() {
      pagesDir = this.resolveSrcDir('pages')

      pageFiles =
        pageFiles ||
        (await glob('**/*.{jsx,tsx,js,ts,vue,svelte}', {
          cwd: pagesDir,
        }))

      return pageFiles.map((file) => {
        const absolutePath = path.join(pagesDir, file)
        return filepathToRoute(pagesDir, absolutePath)
      })
    },

    async getApiRoutes() {
      apiDir = this.resolveSrcDir('api')

      apiFiles =
        apiFiles ||
        (await glob('**/*.{js,ts}', {
          cwd: apiDir,
        }))

      return apiFiles.map((file) => {
        const absolutePath = path.join(apiDir, file)
        return filepathToRoute(apiDir, absolutePath, true)
      })
    },

    async onFileChange(event, filepath) {
      if (event !== 'add' && event !== 'unlink') return

      let isApi = false
      let isPage = false

      if (filepath.startsWith(pagesDir) && pageExtRe.test(filepath)) {
        isPage = true
      }

      if (filepath.startsWith(apiDir) && apiExtRe.test(filepath)) {
        isApi = true
      }

      if (!isApi && !isPage) return

      const files = isApi ? apiFiles : pageFiles

      if (!files) return

      debug('New route, isApi: %s, isPage: $s', isApi, isPage)

      const filename = path.relative(pagesDir, filepath)
      // Ignore files/folders starting with _
      if (filename.startsWith('_') || filename.includes('/_')) return

      if (event === 'add') {
        files.push(filename)
      } else if (event === 'unlink') {
        files.splice(files.indexOf(filename), 1)
      }

      if (isPage) {
        await this.store.writeCommonExports()
      } else {
        await this.store.writeServerExports()
      }
    },
  }
}
