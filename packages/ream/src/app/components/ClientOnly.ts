import {
  ref,
  onMounted,
  defineComponent,
  defineAsyncComponent,
  h,
  AsyncComponentLoader,
} from 'vue'

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

export const defineClientComponent = (load: AsyncComponentLoader) => {
  const Component = defineAsyncComponent(load)
  return {
    name: 'ClientWrapper',
    setup() {
      return () => h(ClientOnly, {}, () => [h(Component)])
    },
  }
}
