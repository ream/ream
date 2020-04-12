import Vue from 'vue'
import Router from 'vue-router'
import { routes } from 'dot-ream/client-routes'

Vue.use(Router)

export function createClientRouter() {
  const router = new Router({
    mode: 'history',
    routes
  })

  return router
}