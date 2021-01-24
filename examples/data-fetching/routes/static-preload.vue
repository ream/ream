<template>
  <div class="posts">
    <h1>Posts</h1>
    <ul>
      <li v-for="post in posts" :key="post.title">
        {{ post.title }}
      </li>
    </ul>
    <Nav />
  </div>
</template>

<script>
export const staticPreload = async () => {
  const arr = new Array(100).fill(null)
  return {
    props: {
      posts: arr.map((_, index) => ({
        title: `${index} post`,
      })),
    },
  }
}
</script>

<script setup>
import { defineProps } from 'vue'
import { useHead } from 'ream/head'
import Nav from '../components/Nav.vue'

defineProps({ posts: null })

useHead({ title: `static preload` })
</script>
