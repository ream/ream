<script lang="ts" setup>
import { useHead } from '@ream/framework-vue'

useHead({
  title: 'About',
})
</script>

<template>
  <h1>About</h1>
  <router-link to="/">Home</router-link>
</template>
