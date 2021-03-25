<script lang="ts" setup>
import { useHead } from 'ream/app'

useHead({
  title: 'Home',
})
</script>

<template>
  <div>
    <h1>Home</h1>
    <ul>
      <li>
        <router-link to="/about">About</router-link>
      </li>
      <li>
        <router-link to="/non-existant">Non-existant</router-link>
      </li>
      <li>
        <router-link to="/error">Some error</router-link>
      </li>
    </ul>
  </div>
</template>
