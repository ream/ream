<script lang="ts">
import { defineComponent } from 'vue'

export const load = async () => {
  const posts = await fetch(`/posts`).then((res) => res.json())
  return {
    props: {
      posts,
    },
  }
}

export default defineComponent({
  props: ['posts'],
})
</script>

<template>
  <div>
    <ul>
      <li v-for="post in posts" :key="post.title">{{ post.title }}</li>
    </ul>
  </div>
</template>
