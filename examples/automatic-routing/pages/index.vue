<script lang="ts" setup>
import { useHead } from '@ream/app'

useHead({
  title: 'Home',
})
</script>

<template>
  <div>
    <h1>Home</h1>
    <ul>
      <li>
        <ream-link to="/about">About</ream-link>
      </li>
    </ul>
  </div>
</template>
