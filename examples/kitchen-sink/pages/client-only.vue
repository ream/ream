<script lang="ts">
import { defineComponent, h } from 'vue'
import { defineClientComponent } from 'ream/app'

const Foo = defineComponent({
  setup() {
    return () => h('h1', { class: 'foo-component' }, ['foo component'])
  },
})

export default defineComponent({
  components: {
    Foo: defineClientComponent(() => Promise.resolve(Foo)),
  },
})
</script>

<template>
  <div>
    <Foo />
  </div>
</template>
