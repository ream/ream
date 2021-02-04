import { h, defineComponent } from 'vue'

export default defineComponent({
  name: 'DefaultApp',
  props: ['Component', 'pageProps'],
  setup({ Component, pageProps }) {
    return () => h(Component, pageProps)
  },
})
