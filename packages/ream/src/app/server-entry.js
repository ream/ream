import 'dot-ream/templates/global-imports.js'
import nodeFetch from 'node-fetch'
import { renderHeadToString } from '@vueuse/head'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createApp } from './create-app'
import {
  clientRoutes,
  ErrorComponent,
} from 'dot-ream/templates/client-routes.js'
import { serverRoutes } from 'dot-ream/templates/server-routes.js'
import * as enhanceApp from 'dot-ream/templates/enhance-app.js'
import * as enhanceServer from 'dot-ream/templates/enhance-server.js'

// Prevent Vite from replacing this
const ENV = process.env

globalThis.fetch = function (url, opts) {
  if (url && url[0] === '/') {
    url = `http://localhost:${ENV.PORT}${url}`
  }
  return nodeFetch(url, opts)
}

export async function render(context) {
  const { app } = await createApp(context)
  return app
}

export function renderHead(app) {
  return renderHeadToString(app.config.globalProperties.$head)
}

// Create a router instance for the Vue app
export function createClientRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: clientRoutes,
  })
  return router
}

// Create a router that's used to match server routes.
export function createServerRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: serverRoutes,
  })

  return router
}

export { clientRoutes, serverRoutes, ErrorComponent, enhanceApp, enhanceServer }
