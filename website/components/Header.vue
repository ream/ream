<template>
  <header class="header bg-blue-600 text-white fixed w-full top-0">
    <div class="container mx-auto flex h-full items-center justify-between">
      <h1 class="text-2xl font-bold">
        <router-link to="/">Ream</router-link>
      </h1>
      <div class="hidden md:flex">
        <a target="_blank" rel="nofollow noreferer" href="https://github.com/ream/ream">GitHub</a>
      </div>
      <div class="flex md:hidden">
        <button @click="showDropdown = !showDropdown">
          <svg
            v-if="showDropdown"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="feather feather-x"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="feather feather-menu"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
      <div class="dropdown fixed bottom-0 left-0 right-0 text-black bg-white overflow-auto" v-if="showDropdown">
        <div class="px-2 py-5">
          <a href="https://github.com/ream/ream">GitHub</a>
        </div>
        <div class="border-b border-gray-300 my-2 md:hidden"></div>
        <div class="px-2 py-5">
          <DocsMenu />
        </div>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import DocsMenu from './DocsMenu.vue'

export default {
  components: {
    DocsMenu,
  },

  data() {
    return {
      showDropdown: false,
    }
  },

  head() {
    return {
      bodyAttrs: {
        'data-no-scroll': this.showDropdown,
      },
    }
  },

  mounted() {
    this.$watch('$route.path', () => {
      this.showDropdown = false
    })
  }
}
</script>

<style scoped>
.header {
  height: var(--header-height);
}

.dropdown {
  top: var(--header-height);
}

.dropdown a {
  @apply text-blue-500;
}

.dropdown a:hover {
  @apply text-blue-700;
}
</style>