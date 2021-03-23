<script lang="ts">
import { defineComponent } from 'vue'
import { useHead } from '@ream/framework-vue'

export default defineComponent({
  setup() {
    useHead({
      title: 'Home',
    })
  },
})
</script>

<template>
  <div>Hello Ream!</div>
</template>
