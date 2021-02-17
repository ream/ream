<script lang="ts" setup>
import { useHead } from '@ream/app'
import { RouterLink } from 'vue-router'

useHead({
  title: 'About!',
})
</script>

<template>
  <div>
    <h1>About</h1>
    <ul>
      <li>
        <RouterLink to="/">Home</RouterLink>
      </li>
    </ul>
  </div>
</template>
