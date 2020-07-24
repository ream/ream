import { h, createSSRApp } from 'vue'
import { createHead } from 'ream/head'
import { createRouter as createVueRouter, RouterView } from 'vue-router'
import { routes } from 'dot-ream/templates/client-routes'
import { onCreatedApp } from 'dot-ream/templates/enhance-app'

/**
 * Execute `preload` in router-level `beforeResolve` and component-level `beforeRouteUpdate`
 * @param {*} vm `vm` is optional  
                  In `beforeResolve` we pass root instance to this function  
                  In `beforeRouteUpdate` we can use `this` instance
 */
export const getBeforeRouteUpdate = (vm) =>
  function (to, from, next) {
    if (!to.matched || to.matched.length === 0) {
      return next()
    }
    const matched = to.matched[0].components.default
    const { preload } = matched
    if (!preload) {
      return next()
    }
    vm = vm || this
    const fetchProps = (next) => {
      preload({ params: to.params }).then((res) => {
        pagePropsStore[to.path] = res.props
        if (next) {
          next()
        }
      })
    }
    const pagePropsStore = vm.$root.pagePropsStore
    if (pagePropsStore[to.path]) {
      next()
      fetchProps()
    } else {
      fetchProps(next)
    }
  }

export const createApp = (context, history) => {
  const app = createSSRApp({
    data() {
      return {
        pagePropsStore: context.pagePropsStore,
      }
    },
    render: () => h(RouterView),
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
