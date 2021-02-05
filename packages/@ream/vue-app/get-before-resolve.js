// @ts-check
import { getPreloadPath } from './runtime-utils'

const noop = () => {}

export const loadPageData = async (to, next = noop) => {
  if (!to.matched || to.matched.length === 0) {
    return next()
  }

  const components = to.matched.map((m) => m.components.default)
  const hasPreload = components.some(
    (component) => component.$$preload || component.$$staticPreload
  )
  if (!hasPreload) {
    return next()
  }

  // @ts-ignore
  const pageDataStore = window._ream.pageDataStore

  const fetchPage = async (next) => {
    const data = {}
    let hasFetched = false

    for (const component of components) {
      if (component.$$clientPreload) {
        const result = await component.$$clientPreload({
          params: to.params,
          query: to.query,
        })
        Object.assign(data, result.data)
      } else if (
        !hasFetched &&
        (component.$$preload || component.$$staticPreload)
      ) {
        const result = await fetch(getPreloadPath(to.path)).then((res) =>
          res.json()
        )
        Object.assign(data, result.data)
      }
    }
    pageDataStore[to.path] = data
    next && next()
  }
  const prevData = pageDataStore[to.path]
  if (prevData && prevData.$cacheFirst) {
    // Page props already exist, use cache and reinvalidate
    next()
    fetchPage()
  } else {
    await fetchPage(next)
  }
}

/**
 * Execute `preload` in router-level `beforeResolve`
 * @param {import('vue').ComponentInternalInstance} vm vm is the root Vue app instance
 */
export const getBeforeResolve = (vm) =>
  async function beforeResolve(to, from, next) {
    await loadPageData(to, next)
  }
