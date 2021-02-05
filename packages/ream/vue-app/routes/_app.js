import { h, defineComponent } from 'vue'
import { RouterView } from 'vue-router'

export default defineComponent({
  name: 'DefaultApp',
  setup() {
    return () => h(RouterView)
  },
})
