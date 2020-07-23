<template>
  <div class="posts">
    <h1>Posts</h1>
    <h2>{{ date }}</h2>
    <Nav />
    <ul>
      <li v-for="post in posts" :key="post.title">
        {{ post.title }}
      </li>
    </ul>
  </div>
</template>

<script>
import Nav from '../components/Nav.vue'
import { sleep } from '../utils/sleep'

export const preload = async () => {
  return {
    props: {
      posts: [
        {
          title: 'First post',
        },
        {
          title: 'Second posts',
        },
      ],
    },
  }
}

export default {
  props: ['posts', 'date'],

  components: {
    Nav,
  },
}
</script>
