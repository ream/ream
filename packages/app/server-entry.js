import '@ream/fetch'
import '/.ream/templates/global-imports.js'
import { renderHeadToString } from '@vueuse/head'
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
  createClientRouter() {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: clientRoutes,
    })
    return router
  },

  // Create a router that's used to match server routes.
  createServerRouter(serverRoutes) {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: serverRoutes,
    })

    return router
  },

  renderHeadToString(app) {
    return renderHeadToString(app.config.globalProperties.$head)
  },

  _document,

  serverRoutes,

  ErrorComponent,
}
