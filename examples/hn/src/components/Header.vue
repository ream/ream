<script lang="ts">
import { defineComponent } from 'vue'
import { useRoute } from 'ream/app'

export default defineComponent({
  setup() {
    const nav = [
      { text: 'Top', link: '/' },
      { text: 'New', link: '/new' },
      { text: 'Show', link: '/show' },
    ]
    const route = useRoute()
    return {
      nav,
      route,
    }
  },
})
</script>

<template>
  <header class="fixed top-0 left-0 right-0 bg-orange-500 h-12 text-gray-200">
    <div class="max-w-3xl mx-auto flex justify-between h-full">
      <div class="flex h-full">
        <ul class="flex space-x-5 items-center">
          <li v-for="item in nav" :key="item.text">
            <router-link
              :to="item.link"
              :class="[route.path === item.link && 'text-white']"
              >{{ item.text }}</router-link
            >
          </li>
        </ul>
      </div>
      <div class="flex h-full items-center">
        <a href="https://ream.dev" target="_blank">Built with Ream</a>
      </div>
    </div>
  </header>
</template>
