import { defineComponent } from 'vue'

export const AppComponent = defineComponent({
  name: 'DefaultApp',
  props: ['Component'],
  setup(_, { slots }) {
    return () => slots.default && slots.default()
  },
})
