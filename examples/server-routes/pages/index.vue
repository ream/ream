<template>
  <div>
    <ul>
      <li v-for="post in page.posts" :key="post.title">{{ post.title }}</li>
    </ul>
  </div>
</template>

<script lang="ts">
import { usePreloadData } from '@ream/app'

export const preload = async () => {
  const posts = await fetch(`/api/posts`).then((res) => res.json())
  return {
    data: {
      posts,
    },
  }
}

export default {
  setup() {
    const page = usePreloadData()
    return {
      page,
    }
  },
}
</script>
