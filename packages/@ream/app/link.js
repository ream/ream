import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'
import { getPreloadPath } from './runtime-utils'

export const ReamLink = defineComponent({
  ...RouterLink,

  name: 'ReamLink',

  mounted() {
    if (import.meta.env.DEV) return

    const { matched, path } = this.$router.resolve(this.to)
    const components = matched.map((m) => m.components.default)
    for (const component of components) {
      if (component.$$staticPreload) {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = getPreloadPath(path)
        document.head.appendChild(link)
      }
    }
  },
})
