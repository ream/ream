import { createSSRApp, createApp as createClientApp, h, App } from 'vue'
import { ClientRoutes, RenderResult, RenderContext } from 'ream/app'
import {
  RouterView,
  RouteRecordRaw,
  Router,
  createRouter,
  createMemoryHistory,
  createWebHistory,
} from 'vue-router'
import { createHead, HeadClient } from '@vueuse/head'

const normalizeRoutes = (routes: ClientRoutes): RouteRecordRaw[] => {
  return routes.map((route) => ({
    name: route.name,
    path: route.path,
    component: route.load,
    children: route.children && normalizeRoutes(route.children),
  }))
}

export const render = async (context: RenderContext): Promise<RenderResult> => {
  let app: App | undefined
  let router: Router | undefined
  let head: HeadClient | undefined

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
      routes: normalizeRoutes(context.routes),
    })

    app.use(router)

    head = createHead()
    app.use(head)
  }

  if (!app || !router || !head) return

  if (import.meta.env.SSR) {
    const { serverRender } = await import('./server-render')
    return serverRender(context, { head, app, router })
  }

  const { clientRender } = await import('./client-render')
  clientRender({ app, router })
}
