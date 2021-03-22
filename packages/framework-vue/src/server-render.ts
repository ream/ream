import { App } from 'vue'
import { Router } from 'vue-router'
import { RenderContext } from 'ream/app'

export const serverRender = async (
  context: RenderContext,
  {
    app,
    router,
  }: {
    app: App
    router: Router
  }
) => {
  router.push(context.url)
  await router.isReady()

  const { renderToString } = await import('@vue/server-renderer')
  const html = await renderToString(app, context)

  return { html: `<div id="_ream">${html}</div>` }
}
