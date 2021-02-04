import '/.ream/templates/global-imports'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createApp } from './create-app'
import { clientRoutes } from '/.ream/templates/client-routes'
import { _document } from '/.ream/templates/server-exports'

export default {
  async render(context) {
    const { app } = createApp(context)

    return app
  },

  // Create a router instance for the Vue app
  async createClientRouter(url) {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: clientRoutes,
    })
    router.push(url)
    await router.isReady()
    return router
  },

  _document,
}
