import '@ream/fetch'
import '/.ream/templates/global-imports.js'
import { renderHeadToString } from '@vueuse/head'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createApp } from './create-app'
import {
  clientRoutes,
  ErrorComponent,
  AppComponent,
} from '/.ream/templates/shared-exports.js'
import { _document, serverRoutes } from '/.ream/templates/server-exports.js'
import { callEnhanceAppAsync } from '/.ream/templates/enhance-app.js'

export default {
  async render(context) {
    const { app } = await createApp(context)
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
  createServerRouter() {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: serverRoutes,
    })

    return router
  },

  renderHeadToString(app) {
    return renderHeadToString(app.config.globalProperties.$head)
  },

  async getGlobalPreload() {
    const { $$preload } = await AppComponent.__asyncLoader()
    return $$preload
  },

  _document,

  clientRoutes,

  serverRoutes,

  ErrorComponent,

  callEnhanceAppAsync,
}
