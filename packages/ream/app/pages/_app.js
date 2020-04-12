export const createApp = () => {
  return {
    functional: true,
    render(h, { props: { Component, pageProps } }) {
      return h(Component, {
        props: pageProps,
      })
    },
  }
}
