import { h, createSSRApp } from 'vue'
import { createHead } from '@vueuse/head'
import { RouterView } from 'vue-router'
import { onCreatedApp } from '/.ream/templates/enhance-app'

export const createApp = ({ pagePropsStore, router }) => {
  const app = createSSRApp({
    data() {
      return {
        pagePropsStore,
      }
    },
    setup() {
      return () => h(RouterView)
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
