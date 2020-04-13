import { join } from 'path'
import Vue from 'vue'
import Meta from 'vue-meta'
import { Request, Response } from 'express'
import { createRenderer } from 'vue-server-renderer'
import devalue from 'devalue'
import { Route } from '@ream/common/dist/route'
import { createServerRouter } from './create-server-router'

Vue.use(Meta, {
  keyName: 'head',
  attribute: 'x-ream-head',
  ssrAttribute: 'x-ream-ssr',
  tagIDKeyName: 'rhid',
  refreshOnceOnNavigation: true,
})

type Obj = {
  [k: string]: any
}

export type GetStaticPropsResult = {
  props: Obj
}

export type StaticPropsContext = {
  params: Obj
}

export type GetStaticProps = (
  context: StaticPropsContext
) => GetStaticPropsResult | Promise<GetStaticPropsResult>

export type ServerSidePropsContext = {
  req: Request
  res: Response
  params: Obj
  query: Obj
  path: string
}

export type GetServerSidePropsResult = {
  props: Obj
}

export type GetServerSideProps = (
  context: ServerSidePropsContext
) => GetServerSidePropsResult | Promise<GetServerSidePropsResult>

export type GetStaticPathsResult = {
  paths: Array<{
    params: Obj
  }>
}

export type GetStaticPaths = () => GetStaticPathsResult | Promise<GetStaticPathsResult>

export type PageInterface = {
  getStaticProps?: GetStaticProps
  getServerSideProps?: GetServerSideProps
  getStaticPaths?: GetStaticPaths
  default: Vue
}

export type RenderContext = {
  req: Request
  res: Response
}

export async function renderToHTML(
  page: PageInterface,
  {
    route,
    clientManifest,
    _app,
    _document,
    buildDir,
    serveStaticProps,
    req,
    res,
  }: {
    route: Route
    clientManifest: any
    _app: any
    _document: any
    buildDir: string
    serveStaticProps?: boolean
    req: Request
    res: Response
  }
) {
  const ssrContext: { [k: string]: any } = {}
  const renderer = createRenderer({
    // @ts-ignore wrong type
    clientManifest,
  })
  const App = _app.createApp()
  const pageProps = await getPageProps(page, {
    buildDir,
    req,
    res,
    pageEntryName: route.entryName,
    serveStaticProps,
  })
  const router = createServerRouter(req.path, {
    // @ts-ignore
    render(h: any) {
      return h(App, {
        props: {
          Component: page.default,
          pageProps,
        },
      })
    },
  })
  const app = new Vue({
    router,
    // @ts-ignore
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

export async function getPageProps(
  page: PageInterface,
  {
    buildDir,
    req,
    res,
    pageEntryName,
    serveStaticProps,
  }: {
    buildDir: string
    req: Request
    res: Response
    pageEntryName: string
    serveStaticProps?: boolean
  }
) {
  if (!page.getServerSideProps || !page.getStaticProps) {
    return false
  }
  const query = req.query
  const params = req.params
  const props = {}

  if (page.getServerSideProps) {
    const serverSidePropsContext = {
      req,
      res,
      query,
      params,
      path: req.path,
    }
    const result = await page.getServerSideProps(serverSidePropsContext)
    Object.assign(props, result?.props)
  }

  if (page.getStaticProps) {
    if (serveStaticProps) {
      const staticPropsContext = {
        query,
        params,
      }
      const result = await page.getStaticProps(staticPropsContext)
      Object.assign(props, result?.props)
    } else {
      Object.assign(
        props,
        require(join(buildDir, `staticprops/${pageEntryName}.json`))
      )
    }
  }

  return props
}
