import 'vite/dynamic-import-polyfill'
import '/.ream/templates/global-imports.js'
import { reactive } from 'vue'
import { createWebHistory, createRouter } from 'vue-router'
import { clientRoutes } from '/.ream/templates/shared-exports.js'
import { createApp } from './create-app'
import { getBeforeResolve } from './get-before-resolve'

const router = createRouter({
  history: createWebHistory(),
  routes: clientRoutes,
})

const initialState = reactive(window.INITIAL_STATE)

const { app } = createApp({
  router,
  initialState,
})

router.isReady().then(() => {
  const vm = app.mount('#_ream')

  window._ream = {
    app: vm,
    router,
    initialState,
  }

  router.beforeResolve(getBeforeResolve(vm))
})
