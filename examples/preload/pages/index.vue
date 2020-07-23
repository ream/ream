<template>
  <div class="page">
    <h1>{{ message }}</h1>
    <Nav />
    <button @click="count++">{{ count }}</button>
  </div>
</template>

<script>
import { ref } from 'vue'
import Nav from '../components/Nav.vue'
import { sleep } from '../utils/sleep'

export const preload = async () => {
  await sleep()
  return {
    props: {
      message: 'hello world',
    },
  }
}

export default {
  props: ['message'],

  components: {
    Nav,
  },

  setup() {
    return {
      count: ref(0),
    }
  },
}
</script>
