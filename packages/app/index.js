import { getCurrentInstance, computed } from 'vue'

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
