<template>
  <div class="page">
    <h1>{{ message }}</h1>
    <Nav />
    <button @click="count++">{{ count }}</button>
  </div>
</template>

<script>
import { sleep } from '../utils/sleep'

export const preload = async () => {
  await sleep(1000)
  return {
    props: {
      message: 'hello world',
    },
  }
}
</script>

<script setup>
import { ref, computed, defineProps } from 'vue'
import { useHead } from 'ream/head'
import Nav from '../components/Nav.vue'

const props = defineProps({
  message: String,
})

const count = ref(0)

useHead({
  title: computed(() => `${count.value} - ${props.message}`),
})
</script>
