<script lang="ts" setup>
import { useHead } from '@ream/framework-vue'

useHead({
  title: 'Home',
})
</script>

<template>
  <h1>hello</h1>
  <router-link to="/about">About</router-link>
</template>
