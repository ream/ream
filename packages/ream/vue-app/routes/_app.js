import { h } from 'vue'

export default {
  name: 'DefaultApp',
  props: ['Component', 'pageProps'],
  setup({ Component, pageProps }) {
    return () => h(Component, pageProps)
  },
}
