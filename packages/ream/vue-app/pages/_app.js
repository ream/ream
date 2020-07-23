import { h } from 'vue'

export default {
  props: ['Component', 'pageProps'],
  setup({ Component, pageProps }) {
    return () => h(Component, pageProps)
  },
}
