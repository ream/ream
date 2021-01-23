<template>
  <div>
    <h1>About</h1>
    <ul>
      <li>
        <router-link to="/">Home</router-link>
      </li>
      <li>
        <router-link to="/post/hello">post: hello</router-link>
      </li>
      <li>
        <router-link to="/post/world">post: world</router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { useHead } from 'ream/head'

useHead({
  title: 'About!!ssss',
})
</script>
