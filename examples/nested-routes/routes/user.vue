<template>
  <div>
    <h1>{{ title }}</h1>
    <router-view></router-view>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export const preload = () => {
  return {
    props: {
      title: 'profile',
    },
  }
}

export default defineComponent({
  props: ['title'],
})
</script>
