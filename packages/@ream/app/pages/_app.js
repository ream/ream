import { h, defineComponent } from 'vue'

export default defineComponent({
  name: 'DefaultApp',
  props: ['Component'],
  setup({ Component }) {
    return () => h(Component)
  },
})
