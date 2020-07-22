import { createRouter as createVueRouter } from 'vue-router'
import { routes } from 'dot-ream/templates/client-routes'

export function createRouter(history) {
  const __createRouter = () =>
    createVueRouter({
      history,
      routes,
    })

  const router = __createRouter()

  if (module.hot) {
    module.hot.accept('dot-ream/templates/client-routes', () => {
      const routes = require('dot-ream/templates/client-routes').routes
      router.options.routes = routes
      router.matcher = __createRouter(routes).matcher
    })
  }

  return router
}
