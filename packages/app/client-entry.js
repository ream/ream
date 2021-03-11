import 'vite/dynamic-import-polyfill'
import '/.ream/templates/global-imports.js'
import { reactive } from 'vue'
import mitt from 'mitt'
import { createWebHistory, createRouter } from 'vue-router'
import { clientRoutes } from '/.ream/templates/shared-exports.js'
import { createApp } from './create-app'
import { getBeforeResolve } from './lib/get-before-resolve'
import { scrollBehavior } from './lib/scroll-behavior'
import { callAsync as callEnhanceAppAsync } from '/.ream/templates/ream.app.js'

window._ream = {
  event: mitt(),
}

async function start() {
  const router = createRouter({
    history: createWebHistory(),
    routes: clientRoutes,
    scrollBehavior,
  })

  window._ream.router = router

  await callEnhanceAppAsync('extendRouter', { router })

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
  window._ream.initialState = initialState

  const { app } = await createApp({
    router,
    initialState,
  })

  await router.isReady()

  const vm = app.mount('#_ream')

  window._ream.app = vm

  router.beforeResolve(getBeforeResolve(vm))
}

start()
