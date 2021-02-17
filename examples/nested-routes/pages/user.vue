<template>
  <div>
    <h1>{{ title }}</h1>
    <ul>
      <li>
        <ream-link to="/user/egoist">egoist</ream-link>
      </li>
      <li>
        <ream-link to="/user/kevin">kevin</ream-link>
      </li>
    </ul>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { usePreloadData } from '@ream/app'
import { defineComponent } from 'vue'

export const preload = () => {
  return {
    data: {
      title: 'profile',
    },
  }
}

export default defineComponent({
  setup() {
    const data = usePreloadData()
    return {
      title: data.value.title,
    }
  },
})
</script>
