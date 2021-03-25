<script lang="ts">
import { defineComponent, computed } from 'vue'
import { Preload, usePageData } from 'ream/app'

export const preload: Preload = ({ params }) => {
  return {
    data: {
      message: `hello ${params.name}`,
    },
  }
}

export default defineComponent({
  setup() {
    const data = usePageData()
    return {
      message: computed(() => data.value.message),
    }
  },
})
</script>

<template>
  <div>{{ message }}</div>
</template>
