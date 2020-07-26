import { h, createSSRApp } from 'vue'
import { createHead, Head } from 'ream/head'
import { createRouter as createVueRouter, RouterView } from 'vue-router'
import { routes } from 'dot-ream/templates/client-routes'
import { onCreatedApp } from 'dot-ream/templates/enhance-app'

export const createApp = (context, history) => {
  const app = createSSRApp({
    data() {
      return {
        pagePropsStore: context.pagePropsStore,
      }
    },
    render: () => [
      h(Head, [
        h('meta', { charset: 'utf-8' }),
        h('meta', {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, shrink-to-fit=no',
        }),
      ]),
      h(RouterView),
    ],
  })

  let router = createVueRouter({
    history,
    routes,
  })

  const head = createHead()

  app.use(router)
  app.use(head)

  if (module.hot) {
    module.hot.accept('dot-ream/templates/client-routes', () => {
      const routes = require('dot-ream/templates/client-routes').routes
      router = createVueRouter({
        history,
        routes,
      })
    })
  }

  onCreatedApp({ app, router })

  return {
    app,
    router,
  }
}
