import 'dot-ream/templates/global-imports'
import { createWebHistory } from 'vue-router'
import { createApp } from './create-app'

const state = window.__REAM__

const { router, app } = createApp(
  {
    pageProps: state.pageProps,
  },
  createWebHistory()
)

router.onReady(() => {
  app.mount('#_ream')

  router.beforeResolve((to, from, next) => {
    if (!to.matched || to.matched.length === 0) {
      return next()
    }
    const matched = to.matched[0].components.default
    const { preload } = matched
    if (!preload) {
      return next()
    }
    preload({}).then((res) => {
      app.$options.pageProps = res.props
      next()
    })
  })
}, console.error)
