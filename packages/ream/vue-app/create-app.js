import { h, createApp as createVueApp } from 'vue'
import { createRouter as createVueRouter } from 'vue-router'
import { routes } from 'dot-ream/templates/client-routes'
import { onCreatedApp } from 'dot-ream/templates/enhance-app'

export const createApp = (context, history) => {
  let router = createVueRouter({
    history,
    routes,
  })

  const app = createVueApp({
    head: {},
    pageProps: context.pageProps,
    setup() {
      return () =>
        h(
          'div',
          {
            attrs: {
              id: '_ream',
            },
          },
          [h('router-view')]
        )
    },
  })

  if (module.hot) {
    module.hot.accept('dot-ream/templates/client-routes', () => {
      const routes = require('dot-ream/templates/client-routes').routes
      router = createVueRouter({
        history,
        routes,
      })
    })
  }

  app.use(router)

  onCreatedApp({ app, router })

  return {
    app,
    router,
  }
}
