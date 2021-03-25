<script lang="ts">
export const load = async () => {
  return {
    props: {
      message: new Date().toString(),
      count: 0,
    },
  }
}
</script>

<script setup lang="ts">
import { computed, defineProps, ref } from 'vue'
import { useHead } from 'ream/app'
import Nav from '../components/Nav.vue'

const props = defineProps<{ message: string; count: number }>()
const count = ref(props.count)

useHead({
  title: computed(() => `${count.value} - ${props.message}`),
})
</script>

<style scoped>
.page {
  background-color: red;
}
</style>

<template>
  <div class="page">
    <h1>{{ props.message }}</h1>
    <Nav />
    <button @click="count++">{{ count }}</button>
  </div>
</template>
