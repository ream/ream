<template>
  <div>
    <h1>Home</h1>
    <ul>
      <li>
        <router-link to="/about">About</router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { useHead } from 'ream/head'

useHead({
  title: 'Home',
})
</script>
