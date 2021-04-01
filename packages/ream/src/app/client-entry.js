import 'vite/dynamic-import-polyfill'
import 'dot-ream/templates/global-imports.js'
import { reactive } from 'vue'
import mitt from 'mitt'
import { createWebHistory, createRouter } from 'vue-router'
import { clientRoutes } from 'dot-ream/templates/client-routes.js'
import { createApp } from './create-app'
import { getBeforeResolve } from './lib/get-before-resolve'
import { scrollBehavior } from './lib/scroll-behavior'
import { callAsync as callEnhanceAppAsync } from 'dot-ream/templates/enhance-app.js'

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
      let { $$transition } = m.components.default
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

  const instance = app.mount('#_ream', true)
  if (import.meta.env.DEV) {
    // Fix vue-devtools: https://github.com/vuejs/vue-devtools/issues/1376
    app._container._vnode = instance.$.vnode
    // router.afterEach(() => {
    //   app._container._vnode = instance.$.vnode
    // })
  }

  window._ream.app = app
  window._ream.instance = instance

  router.beforeResolve(getBeforeResolve(instance))
}

start()
