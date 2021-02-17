import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'
import { getPreloadPath } from './runtime-utils'

const prefetchedLinks = new Set()

export const ReamLink = defineComponent({
  ...RouterLink,

  name: 'ReamLink',

  async mounted() {
    if (import.meta.env.DEV || prefetchedLinks.has(this.to)) return

    const { matched, path } = this.$router.resolve(this.to)
    const components = await Promise.all(
      matched.map((m) =>
        typeof m.components.default === 'function'
          ? m.components.default()
          : m.components.default
      )
    )
    for (const component of components) {
      if (component.$$staticPreload) {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = getPreloadPath(path)
        document.head.appendChild(link)
        prefetchedLinks.add(this.to)
        break
      }
    }
  },
})
