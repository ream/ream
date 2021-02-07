import '@ream/fetch'
import '/.ream/templates/global-imports.js'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createApp } from './create-app'
import {
  clientRoutes,
  ErrorComponent,
} from '/.ream/templates/shared-exports.js'
import { _document, serverRoutes } from '/.ream/templates/server-exports.js'

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

  serverRoutes,

  ErrorComponent,
}
