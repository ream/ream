import { Plugin } from 'vite'
import { transformSync } from '@babel/core'
import eliminator from 'babel-plugin-eliminator'

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
        plugins: [
          [
            eliminator,
            {
              namedExports: ['load', 'preload', 'getStaticPaths'],
              done(state: any) {
                if (
                  state.removedNamedExports.has('load') &&
                  state.removedNamedExports.has('preload')
                ) {
                  throw new Error(
                    `You can't use "load" and "preload" in the same page.`
                  )
                }
              },
            },
          ],
        ],
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
