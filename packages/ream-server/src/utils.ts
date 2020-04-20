import Vue from 'vue'
import { Request, Response } from 'express'
import devalue from 'devalue'
import fs from 'fs'
import { BundleRenderer } from '.'

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

export type GetStaticPaths = () =>
  | GetStaticPathsResult
  | Promise<GetStaticPathsResult>

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
  renderer: BundleRenderer,
  context: {
    url: string
    path: string
    getServerSidePropsContext: false | GetServerSidePropsContext
    getStaticPropsContext: false | GetStaticPropsContext
    [k: string]: any
  },
  pageEntryName: string,
  addtionalPageProps?: any
) {
  const { routes } = renderer.runner.evaluate(`main.js`)
  const page = await routes[pageEntryName]()
  const initialPageProps = await getPageProps(page, {
    path: context.path,
    getServerSidePropsContext: context.getServerSidePropsContext,
    getStaticPropsContext: context.getStaticPropsContext,
  })
  const pageProps = Object.assign({}, initialPageProps, addtionalPageProps)
  context.pageProps = pageProps
  const main = await renderer.renderToString(context)
  const _document = await routes['pages/_document']()
  const meta = context.meta.inject()
  const html = await _document.default({
    main() {
      return main
    },
    head() {
      return `
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="X-UA-Compatible" content="ie=edge" />
      ${meta.meta.text()}
      ${meta.title.text()}
      ${meta.link.text()}
      ${context.renderStyles()}
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
      ${context.renderState()}
      ${context.renderScripts()}
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
    getServerSidePropsContext,
    getStaticPropsContext,
    path,
  }: {
    path: string
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
    if (__DEV__) {
      const result = await page.getStaticProps(getStaticPropsContext)
      Object.assign(props, result?.props)
    } else {
      Object.assign(
        props,
        __non_webpack_require__(
          `../staticprops${
            path === '/' ? '/index' : path
          }.pageprops.json`
        )
      )
    }
  }

  return props
}

export async function getStaticHtml(filename: string) {
  const filepath = `${__REAM_BUILD_DIR__}/${filename}`
  return fs.promises.readFile(filepath, 'utf-8')
}