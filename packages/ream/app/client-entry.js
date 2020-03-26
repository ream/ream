import { createApp } from './app'

const { app, router } = createApp()

router.onReady(() => {
  app.$options.__pageProps = __REAM__.pageProps
  app.$mount('#_ream')

  router.beforeResolve((to, from, next) => {
    if (!to.matched || to.path === from.path) {
      return next()
    }
    const component = to.matched[0].components.default
    if (component.getServerSideProps || component.getStaticProps) {
      fetch(
        to.path === '/' ? `/index.pageprops.json` : `${to.path}.pageprops.json`
      )
        .then(res => res.json())
        .then(res => {
          app.$options.__pageProps = res
          next()
        })
    } else {
      app.$options.__pageProps = null
      next()
    }
  })
}, console.error)
