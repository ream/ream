<template>
  <div>{{ message }}</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { Preload, usePreloadData } from '@ream/app'

export const preload: Preload = ({ params }) => {
  return {
    data: {
      message: `hello ${params.name}`,
    },
  }
}

export default defineComponent({
  setup() {
    const data = usePreloadData()
    return {
      message: computed(() => data.value.message),
    }
  },
})
</script>
