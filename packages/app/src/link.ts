import { defineComponent } from 'vue'
import { RouterLink as VueRouterLink } from 'vue-router'
import { getPreloadPath } from './lib/runtime-utils'

const prefetchedPaths = new Set()

const link = import.meta.env.SSR ? null : document.createElement('link')
const hasPrefetch = import.meta.env.SSR
  ? false
  : link &&
    link.relList &&
    link.relList.supports &&
    link.relList.supports('prefetch')

/**
 * Fetch URL using `<link rel="prefetch">` with fallback to `fetch` API
 * Safari doesn't have it enabled by default: https://caniuse.com/?search=prefetch
 * @param {string} url
 */
const prefetchURL = (url) => {
  if (hasPrefetch) {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
  } else {
    fetch(url, { credentials: `include` })
  }
}

export const RouterLink = defineComponent({
  ...VueRouterLink,

  name: 'RouterLink',

  async mounted() {
    if (import.meta.env.DEV) return

    // @ts-expect-error
    const { matched, path } = this.$router.resolve(this.to)

    if (prefetchedPaths.has(path)) return

    const components = await Promise.all(
      matched.map((m) =>
        typeof m.components.default === 'function'
          ? // @ts-expect-error
            m.components.default()
          : m.components.default
      )
    )
    for (const component of components) {
      if (component.$$staticPreload) {
        const url = getPreloadPath(path)
        prefetchURL(url)
        prefetchedPaths.add(path)
        break
      }
    }
  },
})
