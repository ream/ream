import { App } from 'vue'
import { Router } from 'vue-router'
import { RenderContext } from 'ream/app'
import { HeadClient, renderHeadToString } from '@vueuse/head'

export const serverRender = async (
  context: RenderContext,
  {
    app,
    router,
    head,
  }: {
    app: App
    router: Router
    head: HeadClient
  }
) => {
  router.push(context.url)
  await router.isReady()

  const { renderToString } = await import('@vue/server-renderer')
  const html = await renderToString(app, context)

  const headResult = renderHeadToString(head)

  return {
    html: `<div id="_ream">${html}</div>`,
    head: headResult.headTags,
    htmlAttrs: headResult.htmlAttrs,
    bodyAttrs: headResult.bodyAttrs,
  }
}
