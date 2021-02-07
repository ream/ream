import {
  createRouter as createVueRouter,
  createMemoryHistory,
} from 'vue-router'

/**
 * Create a router that's used to match server routes.
 * Using vue-router under the hood
 */
export const createServerRouter = (serverRoutes: any) => {
  const router = createVueRouter({
    history: createMemoryHistory(),
    routes: serverRoutes,
  })

  return router
}
