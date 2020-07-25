<template>
  <Head>
    <title>{{ title }}</title>
  </Head>
  <div class="page">
    <h1>{{ message }}</h1>
    <Nav />
    <button @click="count++">{{ count }}</button>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { Head } from 'ream/head'
import Nav from '../components/Nav.vue'
import { sleep } from '../utils/sleep'

export const getInitialProps = async () => {
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
    Head,
  },

  setup(props) {
    const count = ref(0)

    return {
      count,
      title: `${count.value} - ${props.message}`,
    }
  },
}
</script>
