import 'dot-ream/templates/global-imports'
import { createWebHistory } from 'vue-router'
import { createApp } from './create-app'
import { getBeforeResolve } from './get-before-resolve'

const state = window.INITIAL_STATE

const { router, app } = createApp(
  {
    pagePropsStore: state.pagePropsStore,
  },
  createWebHistory()
)

router.isReady().then(() => {
  const vm = app.mount('#_ream')

  if (__DEV__) {
    window.__vm__ = vm
  }

  router.beforeResolve(getBeforeResolve(vm))
})
