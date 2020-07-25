<template>
  <div>{{ message }}</div>
</template>

<script>
import { fetch } from 'ream/fetch'

export const preload = () => {
  return fetch('/server-route.json').then((res) => res.json())
}

export default {
  props: ['message'],
}
</script>
