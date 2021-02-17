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
  const initialState = window._ream.initialState

  const fetchPage = async (next) => {
    const result = {}

    for (const component of components) {
      if (component.$$preload || component.$$staticPreload) {
        const _result = await fetch(getPreloadPath(to.path)).then((res) =>
          res.json()
        )
        Object.assign(result, _result)
        // We only need to fetch server once
        break
      }
    }

    initialState[to.path] = result

    next && next()
  }
  const prevResult = initialState[to.path]
  if (prevResult && prevResult.cacheFirst) {
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
