<script lang="ts">
export const preload = async () => {
  return {
    data: {
      message: 'hello world',
      count: 0,
    },
  }
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { usePageData, useHead } from 'ream/app'
import Nav from '../components/Nav.vue'

const page = usePageData()

useHead({
  title: computed(() => `${page.value.count} - ${page.value.message}`),
})
</script>

<style scoped>
.page {
  background-color: red;
}
</style>

<template>
  <div class="page">
    <h1>{{ page.message }}</h1>
    <Nav />
    <button @click="page.count++">{{ page.count }}</button>
  </div>
</template>
