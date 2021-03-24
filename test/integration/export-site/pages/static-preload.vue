<template>
  <div>{{ msg }}</div>
</template>

<script lang="ts">
import { computed } from 'vue'
import { usePageData } from '@ream/app'

export async function staticPreload() {
  return {
    data: {
      msg: 'static preload',
    },
  }
}

export default {
  setup() {
    const data = usePageData()
    return {
      msg: computed(() => data.value.msg),
    }
  },
}
</script>
