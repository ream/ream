<script lang="ts">
import { usePageData } from 'ream/app'
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
    const data = usePageData()
    return {
      title: data.value.title,
    }
  },
})
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <ul>
      <li>
        <router-link to="/user/egoist">egoist</router-link>
      </li>
      <li>
        <router-link to="/user/kevin">kevin</router-link>
      </li>
    </ul>
    <router-view></router-view>
  </div>
</template>
