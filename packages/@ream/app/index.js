import { getCurrentInstance, computed } from 'vue'

export const usePreloadResult = () => {
  const vm = getCurrentInstance()
  return computed(() => vm.root.setupState.preloadResult)
}

export const usePreloadData = () => {
  const vm = getCurrentInstance()
  return computed(() => vm.root.setupState.preloadResult.data || {})
}

export { useHead } from '@vueuse/head'

export { useRoute, useRouter } from 'vue-router'

export { ReamLink } from './link'
