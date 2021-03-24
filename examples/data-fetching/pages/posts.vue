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
import { usePageData, useHead } from 'ream/app'
import Nav from '../components/Nav.vue'

const page = usePageData()

useHead({ title: 'Posts' })
</script>

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
