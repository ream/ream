import { join } from 'path'
import Vue from 'vue'
import { Request, Response } from 'express'
import { createRenderer } from 'vue-server-renderer'
import devalue from 'devalue'
import { useMeta } from './use-meta'
import { createServerApp } from './create-server-app'

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
    pageEntryName,
    clientManifest,
    _app,
    _document,
    buildDir,
    dev,
    path,
    originalPath,
    url,
    getServerSidePropsContext,
    getStaticPropsContext,
    initialPageProps
  }: {
    pageEntryName: string
    clientManifest: any
    _app: any
    _document: any
    buildDir: string
    dev?: boolean
    /** The path that's actually being visted */
    path: string
    /** The path that potentiall contains path-to-regexp templates, like `:id`  */
    originalPath: string
    /** Full URL, including query  */
    url: string
    getServerSidePropsContext: GetServerSidePropsContext | false
    getStaticPropsContext: GetStaticPropsContext | false
    initialPageProps?: Obj
  }
) {
  const ssrContext: { [k: string]: any } = {}
  const renderer = createRenderer({
    // @ts-ignore wrong type
    clientManifest,
  })
  const pageProps = {
    ...initialPageProps,
    ...(await getPageProps(page, {
      buildDir,
      getServerSidePropsContext,
      getStaticPropsContext,
      pageEntryName,
      dev,
    })),
  }
  const app = createServerApp({
    originalPath,
    page,
    pageProps,
    _app
  })
  app.$router.push(url)
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
  if (!page.getServerSideProps && !page.getStaticProps) {
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
  const _error = require(join(buildDir, `server/pages/_error`))
  return {
    clientManifest,
    _app,
    _document,
    _error
  }
}
