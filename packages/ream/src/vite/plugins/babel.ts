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
      if (ssr || id.includes('node_modules')) return

      if (
        !/\.[jt]sx$/.test(id) &&
        !/\.vue$/.test(id) &&
        !id.endsWith('?vue&type=script&lang.ts')
      ) {
        return
      }

      const result = transformSync(code, {
        sourceFileName: id,
        sourceMaps: needSourceMap,
        plugins: [transformPageExports],
      })
      return (
        result && {
          code: result.code!.replace(
            `import.meta.hot.accept(({
  default: updated,
  _rerender_only
}) => {`,
            `
$&
`
          ),
          map: result.map,
        }
      )
    },
  }
}
