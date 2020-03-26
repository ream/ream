<template>
  <div>
    <h1>{{title}}</h1>

    <router-link to="/about">About</router-link>
    <router-link to="/contact">Contact</router-link>
    <router-link to="/foo">foo</router-link>

    <ul>
      <li v-for="post in posts" :key="post.id">
        <router-link :to="`/blog/${post.id}`">{{post.title}}</router-link>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios'

export const getServerSideProps = async () => {
  const posts = await axios
    .get(`http://jsonplaceholder.typicode.com/posts`)
    .then(res => res.data)
  return {
    props: {
      title: 'home',
      posts,
    },
  }
}

export default {
  props: ['title', 'posts'],
}
</script>