import '@templates/global-imports'
import { createWebHistory, createRouter } from 'vue-router'
import { clientRoutes } from '/.ream/templates/client-routes'
import { createApp } from './create-app'
import { getBeforeResolve } from './get-before-resolve'

const state = window.INITIAL_STATE

const router = createRouter({
  history: createWebHistory(),
  routes: clientRoutes,
})

const { app } = createApp({
  pagePropsStore: state.pagePropsStore,
  router,
})

router.isReady().then(() => {
  const vm = app.mount('#_ream')

  if (import.meta.env.DEV) {
    window.__vm__ = vm
  }

  router.beforeResolve(getBeforeResolve(vm))
})
