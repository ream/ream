<script lang="ts">
import { Load } from 'ream/app'

export const load: Load = () => {
  return {
    error: {
      status: 500,
      message: 'something went wrong',
    },
  }
}

export default {}
</script>

<template>
  <div>never show</div>
</template>
