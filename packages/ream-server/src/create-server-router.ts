import Vue, { VueConstructor } from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export function createServerRouter(originalPath: string, Component: VueConstructor) {
  const router = new Router({
    mode: 'abstract',
    routes: [
      {
        path: originalPath,
        component: Component,
      },
    ],
  })

  return router
}
