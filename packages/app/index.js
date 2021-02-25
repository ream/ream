import { getCurrentInstance, computed } from 'vue'
import { useRoute } from 'vue-router'

export const usePreloadResult = () => {
  const vm = getCurrentInstance()
  return computed(() => vm.root.setupState.preloadResult)
}

export const usePageData = () => {
  const vm = getCurrentInstance()
  return computed(() => vm.root.setupState.preloadResult.data || {})
}

export { useHead, createHead } from '@vueuse/head'

export { createSSRApp } from 'vue'

export { useRoute, useRouter, RouterView as ReamView } from 'vue-router'

export { ReamLink } from './link'

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
