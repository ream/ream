import 'dot-ream/templates/global-imports.js'
import nodeFetch from 'node-fetch'
import { renderHeadToString } from '@vueuse/head'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createApp } from './create-app'
import {
  clientRoutes,
  ErrorComponent,
  AppComponent,
} from 'dot-ream/templates/shared-exports.js'
import { serverRoutes } from 'dot-ream/templates/server-exports.js'
import * as enhanceApp from 'dot-ream/templates/enhance-app.js'
import * as enhanceServer from 'dot-ream/templates/enhance-server.js'

globalThis.fetch = function (url, opts) {
  if (url && url[0] === '/') {
    url = `http://localhost:${globalThis.REAM_PORT}${url}`
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

export async function getGlobalLoad() {
  const { load } = await AppComponent.__asyncLoader()
  return load
}

export { clientRoutes, serverRoutes, ErrorComponent, enhanceApp, enhanceServer }
