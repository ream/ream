import Vue from 'vue'
import { createRenderer } from 'vue-server-renderer'
import devalue from 'devalue'
import { createServerRouter } from './create-server-router'
import { useMeta } from './use-meta'

useMeta(Vue)

export async function render({ entryPage, path, clientManifest, _app, _document }, context) {
  const ssrContext = {}
  const { default: PageComponent } = __non_webpack_require__(
    `./${entryPage}.js`
  )
  const renderer = createRenderer({
    clientManifest,
  })
  const pageProps = await renderServerProps({ entryPage }, context)

  const App = _app.createApp()
  const router = createServerRouter(path, {
    render(h) {
      return h(App, {
        props: {
          Component: PageComponent,
          pageProps,
        },
      })
    },
  })
  const app = new Vue({
    router,
    head: {},
    render(h) {
      return h(
        'div',
        {
          attrs: {
            id: '_ream',
          },
        },
        [h('router-view')]
      )
    },
  })
  if (_app.onCreated) {
    _app.onCreated({ app, router })
  }
  const main = await renderer.renderToString(app, ssrContext)
  const meta = app.$meta().inject()
  const html = await _document.default({
    main() {
      return main
    },
    head() {
      return `
      <meta charset="utf-8" />
      ${meta.meta.text()}
      ${meta.title.text()}
      ${meta.link.text()}
      ${ssrContext.renderStyles()}
      ${meta.style.text()}
      ${meta.script.text()}
      ${meta.noscript.text()}`
    },
    script() {
      return `${meta.style.text({ body: true })}
      <script>
      window.__REAM__={pageProps: ${devalue(pageProps)}}
      </script>
      ${meta.script.text({ body: true })}
      ${meta.noscript.text({ body: true })}
      ${ssrContext.renderState()}
      ${ssrContext.renderScripts()}
      `
    },
    htmlAttrs() {
      return meta.htmlAttrs.text(true)
    },
    headAttrs() {
      return meta.headAttrs.text()
    },
    bodyAttrs() {
      return meta.bodyAttrs.text()
    },
  })
  return html
}

export async function renderServerProps({ entryPage }, context) {
  const { getServerSideProps } = __non_webpack_require__(`./${entryPage}.js`)

  if (getServerSideProps) {
    const { props } = await getServerSideProps(context)
    return props
  }
}