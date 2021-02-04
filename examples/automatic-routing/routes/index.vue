<script lang="ts" setup>
import { useHead } from 'ream/head'
import { defineProps } from 'vue'

useHead({
  title: 'Home',
})

defineProps({
  name: {
    type: String,
    required: true,
  },
})
</script>

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
