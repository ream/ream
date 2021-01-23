import { h, createSSRApp } from 'vue'
import { createHead } from '@vueuse/head'
import { createRouter as createVueRouter, RouterView } from 'vue-router'
import { routes } from '/.ream/templates/client-routes'
import { onCreatedApp } from '/.ream/templates/enhance-app'

export const createApp = (context, history) => {
  const app = createSSRApp({
    data() {
      return {
        pagePropsStore: context.pagePropsStore,
      }
    },
    render: () => [h(RouterView)],
  })

  let router = createVueRouter({
    history,
    routes,
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
