// @ts-check
import { getServerPreloadPath } from 'ream/dist/runtime-utils'

/**
 * Execute `preload` in router-level `beforeResolve`
 * @param {import('vue').App} vm vm is the root Vue app instance
 */
export const getBeforeResolve = (vm) =>
  async function beforeResolve(to, from, next) {
    if (!to.matched || to.matched.length === 0) {
      return next()
    }
    const matched = to.matched[0].components.default
    const { preload, hasServerPreload } = matched
    if (!preload && !hasServerPreload) {
      return next()
    }
    const fetchProps = (next) => {
      return Promise.all(
        [
          preload && preload({ params: to.params }),
          hasServerPreload &&
            fetch(getServerPreloadPath(to.path)).then((res) => res.json()),
        ].filter(Boolean)
      ).then(([preloadResult, servePreloadResult]) => {
        pagePropsStore[to.path] = Object.assign(
          {},
          preloadResult,
          servePreloadResult
        )
        if (next) {
          next()
        }
      })
    }
    //@ts-ignore
    const pagePropsStore = vm.$root.pagePropsStore
    if (pagePropsStore[to.path]) {
      // Page props already exist, use cache and reinvalidate
      next()
      fetchProps()
    } else {
      await fetchProps(next)
    }
  }
