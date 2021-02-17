import { h, createSSRApp, isReactive, reactive, computed } from 'vue'
import { createHead } from '@vueuse/head'
import { useRoute } from 'vue-router'
import { RouterView } from 'vue-router'
import {
  AppComponent,
  NotFoundComponent,
  ErrorComponent,
} from '/.ream/templates/shared-exports.js'
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
      const { notFound, error } = this.preloadResult
      let Component = RouterView
      if (notFound) {
        Component = NotFoundComponent
      } else if (error) {
        Component = ErrorComponent
      }
      return h(AppComponent, { Component, key: `${notFound} - ${!error}` })
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
