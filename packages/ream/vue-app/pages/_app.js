import { h } from 'vue'

export default {
  setup({ Component, pageProps }) {
    return () =>
      h(Component, {
        props: pageProps,
      })
  },
}
