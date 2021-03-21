import { createSSRApp, createApp as createClientApp, h, App } from 'vue'
import { ClientRoutes, EntryResult } from 'ream/app'
import {
  RouterView,
  RouteRecordRaw,
  Router,
  createRouter,
  createMemoryHistory,
  createWebHistory,
} from 'vue-router'
import { createHead } from '@vueuse/head'
import { createServerRender } from './server-render'
import { createClientRender } from './client-render'

const normalizeRoutes = (routes: ClientRoutes): RouteRecordRaw[] => {
  return routes.map((route) => ({
    name: route.name,
    path: route.path,
    component: route.load,
    children: route.children && normalizeRoutes(route.children),
  }))
}

export const createApp = ({
  routes,
}: {
  routes: ClientRoutes
}): EntryResult => {
  let app: App | undefined
  let router: Router | undefined

  if (REAM_SSR_ENABLED || !import.meta.env.SSR) {
    const createApp = REAM_SSR_ENABLED ? createSSRApp : createClientApp
    app = createApp({
      setup() {
        return () => {
          return h(RouterView)
        }
      },
    })
    const history = import.meta.env.SSR
      ? createMemoryHistory()
      : createWebHistory()
    router = createRouter({
      history,
      routes: normalizeRoutes(routes),
    })

    app.use(router)

    const head = createHead()
    app.use(head)
  }

  return {
    serverRender:
      import.meta.env.SSR && app && router
        ? createServerRender({ app, router })
        : undefined,
    clientRender:
      !import.meta.env.SSR && app && router
        ? createClientRender({ app, router })
        : undefined,
  }
}
