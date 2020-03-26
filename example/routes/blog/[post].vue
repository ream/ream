<template>
  <div>
    <h2>{{post.title}}</h2>
    <p>{{post.body}}</p>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  props: ['post'],

  async getServerSideProps({ params }) {
    const post = await axios
      .get(`http://jsonplaceholder.typicode.com/posts/1`)
      .then(res => res.data)
    return {
      post
    }
  },
}
</script>