import 'vite/dynamic-import-polyfill'
import '/.ream/templates/global-imports.js'
import { reactive } from 'vue'
import { createWebHistory, createRouter } from 'vue-router'
import { clientRoutes } from '/.ream/templates/client-routes.js'
import { createApp } from './create-app'
import { getBeforeResolve } from './get-before-resolve'

const router = createRouter({
  history: createWebHistory(),
  routes: clientRoutes,
})

const pageDataStore = reactive(window.INITIAL_STATE.pageDataStore)

const { app } = createApp({
  router,
  pageDataStore,
})

router.isReady().then(() => {
  const vm = app.mount('#_ream')

  window._ream = {
    app: vm,
    router,
    pageDataStore,
  }

  router.beforeResolve(getBeforeResolve(vm))
})
