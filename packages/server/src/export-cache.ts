import path from 'path'
import { LRU } from './lru'
import type { PreloadResult } from './render'
import { outputFile, readFile } from './fs'
import serializeJavascript from 'serialize-javascript'

type PageCache = {
  html?: string
  preloadResult: PreloadResult
}

type Options = {
  exportDir: string
  flushToDisk: boolean
  /**
   * Make `.get` always return `undefined`
   * a.k.a use as a write only storage
   * Mainly used for `ream export`
   */
  writeOnly?: boolean
}

export const getExportOutputPath = (
  pathname: string,
  type: 'html' | 'json',
  exportDir: string
) => {
  let filename: string
  // Remove trailing slash
  pathname = pathname.replace(/\/$/, '') || 'index'

  if (type === 'json') {
    filename = `${pathname}.preload.json`
  } else {
    if (pathname.endsWith('.html')) {
      filename = pathname
    } else {
      filename = pathname === 'index' ? 'index.html' : `${pathname}/index.html`
    }
  }

  return path.join(exportDir, filename)
}

export class ExportCache {
  cache: LRU<PageCache>
  options: Options

  constructor(options: Options) {
    this.cache = new LRU({ max: 1000 })
    this.options = options
  }

  getOutputPath(pathname: string, type: 'html' | 'json') {
    return getExportOutputPath(pathname, type, this.options.exportDir)
  }

  get writeOnly() {
    return this.options.writeOnly
  }

  async get(pathname: string) {
    if (this.options.writeOnly) return

    let data = this.cache.get(pathname)

    if (!data && this.options.flushToDisk) {
      const htmlPath = this.getOutputPath(pathname, 'html')
      const jsonPath = this.getOutputPath(pathname, 'json')
      try {
        const [html, preloadResult] = await Promise.all([
          readFile(htmlPath, 'utf8'),
          readFile(jsonPath, 'utf8').then((res) => JSON.parse(res)),
        ])
        data = { html, preloadResult }
      } catch (_) {
        // Error getting cache
      }
    }

    return data
  }

  async set(
    pathname: string,
    { html, preloadResult }: { html?: string; preloadResult: PreloadResult }
  ) {
    this.cache.set(pathname, { html, preloadResult })
    if (this.options.flushToDisk) {
      const htmlPath = this.getOutputPath(pathname, 'html')
      const jsonPath = this.getOutputPath(pathname, 'json')
      const json = serializeJavascript(preloadResult, { isJSON: true })
      await Promise.all([
        html ? outputFile(htmlPath, html, 'utf8') : null,
        outputFile(jsonPath, json, 'utf8'),
      ])
    }
  }
}
