<script lang="ts">
import { defineComponent, h } from 'vue'
import { defineClientOnlyComponent } from '@ream/app'

const Foo = defineComponent({
  setup() {
    return () => h('h1', { class: 'foo-component' }, ['foo component'])
  },
})

export default defineComponent({
  components: {
    Foo: defineClientOnlyComponent(() => Promise.resolve(Foo)),
  },
})
</script>

<template>
  <Foo />
</template>
