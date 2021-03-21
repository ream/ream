import { App } from 'vue'
import { Router } from 'vue-router'
import { ServerRenderContext } from 'ream/app'

export const createServerRender = ({
  app,
  router,
}: {
  app: App
  router: Router
}) => async (context: ServerRenderContext) => {
  router.push(context.url)
  await router.isReady()

  const { renderToString } = await import('@vue/server-renderer')
  const html = await renderToString(app, context)

  return { html: `<div id="_ream">${html}</div>` }
}
