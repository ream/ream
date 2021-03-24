import { h, defineComponent } from 'vue'

export default defineComponent({
  name: 'DefaultApp',
  props: ['Component'],
  setup(_, { slots }) {
    return () => slots.default()
  },
})
