import 'dot-ream/templates/global-imports'
import { createApp } from './create-app'
import { routes } from 'dot-ream/templates/all-routes'
import { createMemoryHistory } from 'vue-router'

export default async (context) => {
  const { router, app } = createApp(context, createMemoryHistory())

  router.push(context.url)

  await router.isReady()

  return app
}

// Expose all routes
export { routes }
