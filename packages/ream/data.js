import { getCurrentInstance } from 'vue'

export const usePageData = () => {
  const vm = getCurrentInstance()
  return vm.root.setupState.page
}
