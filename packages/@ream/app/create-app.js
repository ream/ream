import { h, createSSRApp, isReactive, reactive, computed } from 'vue'
import { createHead } from '@vueuse/head'
import { useRoute, RouterView } from 'vue-router'
import { ReamLink } from './'
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
      const preloadResult = computed(() => {
        if (store[route.path]) {
          return store[route.path]
        }
        if (Object.keys(store).length === 1 && store['/404.html']) {
          return store['/404.html']
        }
        return {}
      })
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

  app.component(ReamLink.name, ReamLink)

  onCreatedApp({ app, router })

  return {
    app,
    router,
  }
}
