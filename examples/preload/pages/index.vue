<template>
  <div class="page">
    <h1>{{ message }}</h1>
    <Nav />
    <button @click="count++">{{ count }}</button>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { useHead } from 'ream/head'
import Nav from '../components/Nav.vue'
import { sleep } from '../utils/sleep'

export const preload = async () => {
  await sleep(1000)
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

  setup(props) {
    const count = ref(0)
    useHead(() => ({
      title: `${count.value} - ${props.message}`,
    }))

    return {
      count,
    }
  },
}
</script>
