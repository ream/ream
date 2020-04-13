import Vue from 'vue'
import { useMeta } from 'ream-server/dist/use-meta'
import { createClientRouter } from './create-client-router'
import { _app } from 'dot-ream/client-routes'

useMeta()

const state = window.__REAM__

const router = createClientRouter()

const app = new Vue({
  router,
  pageProps: state.pageProps,
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

_app.onCreated &&
  _app.onCreated({
    app,
    router,
  })

router.onReady(() => {
  app.$mount('#_ream')

  router.beforeResolve((to, from, next) => {
    if (!to.matched || to.matched.length === 0) {
      return next()
    }
    const { getServerSideProps } = to.matched[0].components.default
    if (!getServerSideProps) {
      return next()
    }
    fetch(`${to.path === '/' ? '/index' : to.path}.pageprops.json`)
      .then(res => res.json())
      .then(res => {
        app.$options.pageProps = res
        next()
      })
  })
}, console.error)

if (module.hot) {
  module.hot.accept('dot-ream/client-routes', () => {
    _app = require('dot-ream/client-routes')._app
  })
}
