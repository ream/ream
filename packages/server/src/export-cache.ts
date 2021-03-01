import path from 'path'
import { LRU } from './lru'
import type { PreloadResult } from './render'
import { outputFile, readFile } from './fs'
import serializeJavascript from 'serialize-javascript'

type PageCache = {
  html?: string
  preloadResult: PreloadResult
}

type Options = { exportDir: string; flushToDisk: boolean }

export const getExportOutputPath = (
  pathname: string,
  ext: '.html' | '.preload.json',
  exportDir: string
) => {
  return path.join(
    exportDir,
    `${pathname === '/' ? '/index' : pathname}${
      pathname.endsWith(ext) ? '' : ext
    }`
  )
}

export class ExportCache {
  cache: LRU<PageCache>
  options: Options

  constructor(options: Options) {
    this.cache = new LRU({ max: 1000 })
    this.options = options
  }

  getOutputPath(pathname: string, ext: '.html' | '.preload.json') {
    return getExportOutputPath(pathname, ext, this.options.exportDir)
  }

  async get(pathname: string) {
    let data = this.cache.get(pathname)

    if (!data && this.options.flushToDisk) {
      const htmlPath = this.getOutputPath(pathname, '.html')
      const jsonPath = this.getOutputPath(pathname, '.preload.json')
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
      const htmlPath = this.getOutputPath(pathname, '.html')
      const jsonPath = this.getOutputPath(pathname, '.preload.json')
      const json = serializeJavascript(preloadResult, { isJSON: true })
      await Promise.all([
        html ? outputFile(htmlPath, html, 'utf8') : null,
        outputFile(jsonPath, json, 'utf8'),
      ])
    }
  }
}
