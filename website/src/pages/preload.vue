<script lang="ts">
import { usePageData } from '@ream/app'

export const preload = () => {
  return { data: { message: 'hello' } }
}

export default {
  setup() {
    const page = usePageData()
    return { page }
  },
}
</script>

<template>
  <div>{{ page.message }}</div>
</template>
