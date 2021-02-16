<template>
  <div class="posts">
    <h1>Posts</h1>
    <ul>
      <li v-for="post in page.posts" :key="post.title">
        {{ post.title }}
      </li>
    </ul>
    <Nav />
  </div>
</template>

<script lang="ts">
export const preload = async () => {
  const arr = new Array(10).fill(null)
  return {
    data: {
      posts: arr.map((_, index) => ({
        title: `${index} post`,
      })),
    },
  }
}
</script>

<script setup lang="ts">
import { usePreloadData } from 'ream/data'
import { useHead } from 'ream/head'
import Nav from '../components/Nav.vue'

const page = usePreloadData()

useHead({ title: 'Posts' })
</script>
