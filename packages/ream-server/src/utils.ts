import { join } from 'path'
import Vue from 'vue'
import { Request, Response } from 'express'
import { createRenderer } from 'vue-server-renderer'
import devalue from 'devalue'
import { Route } from '@ream/common/dist/route'
import { createServerRouter } from './create-server-router'
import { useMeta } from './use-meta'

useMeta()

type Obj = {
  [k: string]: any
}

export type GetStaticPropsResult = {
  props: Obj
}

export type GetStaticPropsContext = {
  params: Obj
}

export type GetStaticProps = (
  context: GetStaticPropsContext
) => GetStaticPropsResult | Promise<GetStaticPropsResult>

export type GetServerSidePropsContext = {
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
  context: GetServerSidePropsContext
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
    dev,
    path,
    getServerSidePropsContext,
    getStaticPropsContext
  }: {
    route: Route
    clientManifest: any
    _app: any
    _document: any
    buildDir: string
    dev?: boolean
    path: string
    getServerSidePropsContext: GetServerSidePropsContext | false
    getStaticPropsContext: GetStaticPropsContext | false
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
    getServerSidePropsContext,
    getStaticPropsContext,
    pageEntryName: route.entryName,
    dev,
  })
  const router = createServerRouter(path, {
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
    getServerSidePropsContext,
    getStaticPropsContext,
    pageEntryName,
    dev,
  }: {
    buildDir: string
    pageEntryName: string
    dev?: boolean
    getServerSidePropsContext: GetServerSidePropsContext | false
    getStaticPropsContext: GetStaticPropsContext | false
  }
) {
  if (!page.getServerSideProps || !page.getStaticProps) {
    return false
  }

  const props = {}

  if (page.getServerSideProps && getServerSidePropsContext) {
    const result = await page.getServerSideProps(getServerSidePropsContext)
    Object.assign(props, result?.props)
  }

  if (page.getStaticProps && getStaticPropsContext) {
    if (dev) {
      const result = await page.getStaticProps(getStaticPropsContext)
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

export function getServerAssets(buildDir: string) {
  const clientManifest = require(join(
    buildDir,
    'client/vue-ssr-client-manifest.json'
  ))
  const _app = require(join(buildDir, `server/pages/_app`))
  const _document = require(join(buildDir, `server/pages/_document`))
  return {
    clientManifest,
    _app,
    _document
  }
}