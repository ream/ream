import { createApp } from './create-app'
import { routes } from 'dot-ream/all-routes'

function routerReady(router) {
  return new Promise((resolve, reject) => {
    router.onReady(resolve, reject)
  })
}

export default async (context) => {
  const { router, app } = createApp(context)

  router.push(context.url)

  await routerReady(router)

  context.meta = app.$meta()

  return app
}

// Expose all routes for getStaticProps/getServerSideProps and API routes
export {
  routes
}