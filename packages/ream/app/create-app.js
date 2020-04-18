import Vue from 'vue'
import { createRouter } from './create-router'
import './use-meta'
import { onCreatedApp } from 'dot-ream/enhance-app'

Vue.config.productionTip = false

export const createApp = (context) => {
  const router = createRouter()

  const app = new Vue({
    head: {},
    router,
    pageProps: context.pageProps,
    render(h) {
      return h(
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

  onCreatedApp({ app, router })

  return {
    app,
    router,
  }
}
