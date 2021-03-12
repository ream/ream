import { defineComponent } from 'vue'
import { RouterLink as VueRouterLink } from 'vue-router'
import { getPreloadPath } from './lib/runtime-utils'

const prefetchedPaths = new Set()

export const RouterLink = defineComponent({
  ...VueRouterLink,

  name: 'RouterLink',

  async mounted() {
    if (import.meta.env.DEV) return

    const { matched, path } = this.$router.resolve(this.to)

    if (prefetchedPaths.has(path)) return

    const components = await Promise.all(
      matched.map((m) =>
        typeof m.components.default === 'function'
          ? m.components.default()
          : m.components.default
      )
    )
    for (const component of components) {
      if (component.$$staticPreload) {
        const url = getPreloadPath(path)
        fetch(url, { credentials: `include` })
        prefetchedPaths.add(path)
        break
      }
    }
  },
})
