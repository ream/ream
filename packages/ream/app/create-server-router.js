import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export function createServerRouter(path, Component) {
  const router = new Router({
    mode: 'abstract',
    routes: [
      {
        path,
        component: Component
      }
    ]
  })

  router.push(path)

  return router
}