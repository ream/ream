import '/.ream/templates/global-imports'
import { createApp } from './create-app'
import { createMemoryHistory } from 'vue-router'
import allRoutes from '/.ream/templates/all-routes'

export default {
  async render(context) {
    const { router, app } = createApp(context, createMemoryHistory())

    router.push(context.url)

    await router.isReady()

    return app
  },

  routes: allRoutes,
}
