// @ts-check
import { getPreloadPath } from './runtime-utils'

const noop = () => {}

export const loadPageData = async (to, next = noop) => {
  if (!to.matched || to.matched.length === 0) {
    return next()
  }

  // @ts-ignore
  const initialState = window._ream.initialState

  if (to.name === '404') {
    initialState.preload[to.path] = { notFound: true }
    return next()
  }

  const components = to.matched.map((m) => m.components.default)
  const hasPreload = components.some(
    (component) => component.$$preload || component.$$staticPreload
  )
  if (!hasPreload) {
    initialState.preload[to.path] = { hasPreload: false }
    return next()
  }

  const fetchPage = async (next) => {
    const result = {}

    for (const component of components) {
      if (component.$$preload || component.$$staticPreload) {
        const _result = await fetch(getPreloadPath(to.path)).then((res) => {
          if (res.status === 404) {
            return { notFound: true }
          }
          return res.json()
        })

        Object.assign(result, _result)
        // We only need to fetch server once
        break
      }
    }

    initialState.preload[to.path] = result

    next(result.redirect ? result.redirect.url : undefined)
  }

  await fetchPage(next)
}

/**
 * Execute `preload` in router-level `beforeResolve`
 */
export const getBeforeResolve = () =>
  async function beforeResolve(to, from, next) {
    await loadPageData(to, next)
  }
