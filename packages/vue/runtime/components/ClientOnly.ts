import { ref, onMounted, defineComponent, defineAsyncComponent, h } from 'vue'

export const ClientOnly = defineComponent({
  name: 'ClientOnly',

  setup(_, { slots }) {
    const show = ref(false)
    onMounted(() => {
      show.value = true
    })
    return () => (show.value && slots.default ? slots.default() : null)
  },
})

export const defineClientOnlyComponent = (load) => {
  const Component = defineAsyncComponent(load)
  return {
    name: 'ClientOnlyWrapper',
    setup() {
      return () => h(ClientOnly, {}, () => [h(Component)])
    },
  }
}
