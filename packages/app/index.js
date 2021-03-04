import { getCurrentInstance, computed } from 'vue'
import { useRoute } from 'vue-router'

export const usePreloadResult = () => {
  const vm = getCurrentInstance()
  const routePath = useRoutePath()

  return computed(() => {
    const { preload } = vm.root.setupState.initialState
    if (preload[routePath.value]) {
      return preload[routePath.value]
    }
    if (Object.keys(preload).length === 1 && preload['/404.html']) {
      return preload['/404.html']
    }
    return {}
  })
}

export const usePageData = () => {
  const preloadResult = usePreloadResult()
  return computed(() => preloadResult.value.data || {})
}

export { useHead, createHead } from '@vueuse/head'

export { createSSRApp } from 'vue'

export { useRoute, useRouter, RouterView } from 'vue-router'

export { RouterLink } from './link'

export { ClientOnly, defineClientOnlyComponent } from './components/ClientOnly'

/**
 * Get the route path without trailing slash
 */
export const useRoutePath = () => {
  const route = useRoute()
  return computed(() => {
    const p = route.path === '/' ? '/' : route.path.replace(/\/$/, '')
    return p
  })
}
