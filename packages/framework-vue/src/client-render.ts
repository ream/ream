import { App } from 'vue'
import { Router } from 'vue-router'

export const clientRender = async ({
  app,
  router,
}: {
  app: App
  router: Router
}) => {
  await router.isReady()
  app.mount('#_ream', REAM_SSR_ENABLED)
}
