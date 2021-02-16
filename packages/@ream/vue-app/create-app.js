import { h, createSSRApp, isReactive, reactive, computed } from 'vue'
import { createHead } from '@vueuse/head'
import { useRoute } from 'vue-router'
import { AppComponent } from '/.ream/templates/shared-exports.js'
import { onCreatedApp } from '/.ream/templates/enhance-app.js'

export const createApp = ({ router, pageDataStore }) => {
  const app = createSSRApp({
    setup() {
      const store = isReactive(pageDataStore)
        ? pageDataStore
        : reactive(pageDataStore)
      const route = useRoute()
      const page = computed(() => store[route.path] || {})
      return {
        pageDataStore: store,
        page,
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
