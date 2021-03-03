import 'vite/dynamic-import-polyfill'
import '/.ream/templates/global-imports.js'
import { reactive } from 'vue'
import mitt from 'mitt'
import { createWebHistory, createRouter } from 'vue-router'
import { clientRoutes } from '/.ream/templates/shared-exports.js'
import { createApp } from './create-app'
import { getBeforeResolve } from './lib/get-before-resolve'
import { scrollBehavior } from './lib/scroll-behavior'

const router = createRouter({
  history: createWebHistory(),
  routes: clientRoutes,
  scrollBehavior,
})

router.afterEach((to, from) => {
  let transition
  for (const m of to.matched) {
    const { $$transition } = m.components.default
    if (typeof $$transition === 'function') {
      $$transition = $$transition(to, from)
    }
    if ($$transition != null) {
      transition = $$transition
    }
  }
  to.meta.transition = transition
})

const initialState = reactive(window.INITIAL_STATE)

const { app } = createApp({
  router,
  initialState,
})

window._ream = {
  router,
  initialState,
  event: mitt(),
}

router.isReady().then(() => {
  const vm = app.mount('#_ream')

  window._ream.app = vm

  router.beforeResolve(getBeforeResolve(vm))
})
