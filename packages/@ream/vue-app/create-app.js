import { h, createSSRApp, isReactive, reactive, computed } from 'vue'
import { createHead } from '@vueuse/head'
import { useRoute } from 'vue-router'
import { AppComponent } from '/.ream/templates/shared-exports.js'
import { onCreatedApp } from '/.ream/templates/enhance-app.js'

export const createApp = ({ router, initialState }) => {
  const app = createSSRApp({
    setup() {
      const store = isReactive(initialState)
        ? initialState
        : reactive(initialState)
      const route = useRoute()
      const preloadResult = computed(() => store[route.path] || {})
      return {
        initialState: store,
        preloadResult,
      }
    },
    render() {
      return h(AppComponent)
    },
  })

  const head = createHead()

  app.use(router)
  app.use(head)

  onCreatedApp({ app, router })

  return {
    app,
    router,
  }
}
