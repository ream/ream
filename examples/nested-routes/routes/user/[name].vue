<template>
  <div>{{ message }}</div>
</template>

<script>
import { defineComponent } from 'vue'

export const preload = (ctx) => {
  return {
    props: {
      message: `hello ${ctx.params.name}`,
    },
  }
}

export default defineComponent({
  props: ['message'],
})
</script>
