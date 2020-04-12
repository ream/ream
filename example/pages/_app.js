export const createApp = () => {
  return {
    functional: true,
    render(h, { props: { Component, pageProps } }) {
      return h(Component, {
        props: pageProps
      })
    }
  }
}

export const onCreated = ({ router }) => {
  router.beforeEach((from, to, next) => {
    console.log(`Progress bar starts..`)
    next()
  })

  router.afterEach((from, to) => {
    console.log(`Progress bar stops..`)
  })
}