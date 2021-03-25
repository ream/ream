import { getLoadPath } from './runtime-utils'

const noop = () => {}

export const loadPageData = async (to, next = noop) => {
  if (!to.matched || to.matched.length === 0) {
    return next()
  }

  // @ts-ignore
  const initialState = window._ream.initialState

  if (to.name === '404') {
    initialState.load[to.path] = { notFound: true }
    return next()
  }

  const components = to.matched.map((m) => m.components.default)
  const hasLoad = components.some(
    (component) => component.$$load || component.$$preload
  )
  if (!hasLoad) {
    initialState.load[to.path] = { hasLoad: false }
    return next()
  }

  const fetchPage = async (next) => {
    const result = {}

    for (const component of components) {
      if (component.$$load || component.$$preload) {
        const _result = await fetch(getLoadPath(to.path)).then((res) => {
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

    initialState.load[to.path] = result

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
