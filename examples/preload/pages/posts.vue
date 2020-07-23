<template>
  <div class="posts">
    <h1>Posts</h1>
    <h2>{{ date }}</h2>
    <ul>
      <li v-for="post in posts" :key="post.title">
        {{ post.title }}
      </li>
    </ul>
    <Nav />
  </div>
</template>

<script>
import Nav from '../components/Nav.vue'
import { sleep } from '../utils/sleep'
import { useHead } from 'ream/head'

export const preload = async () => {
  const arr = new Array(100).fill(null)
  return {
    props: {
      posts: arr.map((_, index) => ({
        title: `${index} post`,
      })),
    },
  }
}

export default {
  props: ['posts', 'date'],

  components: {
    Nav,
  },

  setup() {
    useHead(() => ({
      title: 'Posts',
    }))
  },
}
</script>
