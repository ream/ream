import { join } from 'path'
import fs from 'fs'
import { serverModules } from '#build/routes'
import { createRouter } from './router'
import { createApp } from './app'
import document from './document'

const routerReady = router =>
  new Promise((resolve, reject) => {
    router.onReady(resolve, reject)
  })

async function getServerSideProps(components, context) {
  const [component] = components

  if (component && component.getServerSideProps) {
    return component.getServerSideProps(context)
  }

  return null
}

async function getStaticProps(components, context) {
  const [component] = components

  if (component && component.getStaticProps) {
    if (process.env.NODE_ENV === 'production' && !context.exportPageProps) {
      const filePath = join(
        __REAM_BUILD_DIR__,
        'pageprops',
        context.path === '/'
          ? 'index.pageprops.json'
          : `${context.path}.pageprops.json`
      )
      return {
        props: JSON.parse(
          await fs.promises.readFile(
            filePath,
            'utf8'
          )
        )
      }
    }
    return component.getStaticProps(context)
  }

  return null
}

async function getAllProps(router, context, options = {}) {
  if (router.currentRoute) {
    context.params = router.currentRoute.params
  }
  const components = router.getMatchedComponents()
  const serverSideProps =
    !options.disableServerSideProps &&
    (await getServerSideProps(components, context))
  const staticProps =
    !options.disableStaticProps && (await getStaticProps(components, context))

  if (!serverSideProps && !staticProps) {
    return null
  }

  const props = Object.assign({}, serverSideProps, staticProps)
  return props
}

export default async context => {
  const { app, router } = createApp()

  router.push(context.path)

  await routerReady(router)
  const props = await getAllProps(router, context)

  if (props) {
    context.__pageProps = props.props
    app.$options.__pageProps = props.props
  } else {
    context.__pageProps = null
    app.$options.__pageProps = null
  }

  if (context.res && router.currentRoute.name === 404) {
    context.res.statusCode = 404
  }

  context.app = app

  return app
}

export const getAllPropsStandalone = async (context, options) => {
  const router = createRouter()
  router.push(context.path)
  await routerReady(router)

  return getAllProps(router, context, options)
}

export const getServerModule = chunkName => {
  return serverModules && serverModules.get(chunkName)
}

export const getDocument = ctx => {
  const customDocument = getServerModule('__document__')
  if (customDocument) {
    return customDocument().then(res => res.default(ctx))
  }
  return document(ctx)
}
