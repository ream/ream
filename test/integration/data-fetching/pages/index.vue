<template>
  <div>{{ msg }}</div>
</template>

<script lang="ts">
import { computed } from 'vue'
import { usePreloadData } from '@ream/app'

export async function preload() {
  return {
    data: {
      msg: 'hello world',
    },
  }
}

export default {
  setup() {
    const data = usePreloadData()
    return {
      msg: computed(() => data.value.msg),
    }
  },
}
</script>
