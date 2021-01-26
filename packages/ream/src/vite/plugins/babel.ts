import { Plugin } from 'vite'
import { transformSync } from '@babel/core'
import transformPageExports from '../../babel/transform-page-exports'

export const babelPlugin = (): Plugin => {
  let needSourceMap = false

  return {
    name: `ream:babel`,

    configResolved(config) {
      needSourceMap = Boolean(config.build.sourcemap)
    },

    transform(code, id, ssr) {
      if (ssr || !/\.[jt]sx$/.test(id)) return

      const result = transformSync(code, {
        sourceFileName: id,
        sourceMaps: needSourceMap,
        plugins: [transformPageExports],
      })

      return result && { code: result.code!, map: result.map }
    },
  }
}
