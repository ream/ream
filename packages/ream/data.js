import { getCurrentInstance, computed } from 'vue'

export const usePreloadData = () => {
  const vm = getCurrentInstance()
  return computed(() => vm.root.setupState.page)
}
