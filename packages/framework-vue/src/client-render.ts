import { App } from 'vue'
import { Router } from 'vue-router'

export const createClientRender = ({
  app,
  router,
}: {
  app: App
  router: Router
}) => async () => {
  await router.isReady()
  app.mount('#_ream', REAM_SSR_ENABLED)
}
