import { createApp } from './create-app'

const state = window.__REAM__

const { router, app } = createApp({
  pageProps: state.pageProps
})

router.onReady(() => {
  app.$mount('#_ream')

  router.beforeResolve((to, from, next) => {
    if (!to.matched || to.matched.length === 0) {
      return next()
    }
    const {
      getServerSideProps,
      getStaticProps,
    } = to.matched[0].components.default
    if (!getServerSideProps && !getStaticProps) {
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
