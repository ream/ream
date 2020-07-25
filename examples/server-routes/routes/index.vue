<template>
  <div>
    <ul>
      <li v-for="post in posts" :key="post.title">{{ post.title }}</li>
    </ul>
  </div>
</template>

<script>
import { fetch } from 'ream/fetch'

export const getInitialProps = async () => {
  const posts = await fetch(`/api/posts`).then((res) => res.json())
  return {
    props: {
      posts,
    },
  }
}

export default {
  props: ['posts'],
}
</script>
