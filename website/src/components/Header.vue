<template>
  <header class="header bg-blue-500 text-white fixed w-full top-0 z-10">
    <Head>
      <!-- <body :data-no-scroll="showDropdown" /> -->
    </Head>
    <div class="px-5 flex h-full items-center justify-between mx-auto">
      <h1 class="text-2xl font-bold">
        <router-link to="/">Ream</router-link>
      </h1>
      <div class="hidden lg:flex space-x-8">
        <a
          v-for="item in navLinks"
          target="_blank"
          class="flex"
          rel="nofollow noreferer"
          :href="item.link"
          :key="item.link"
          >{{ item.title }}</a
        >
      </div>
      <div class="flex lg:hidden">
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
      <div
        class="dropdown fixed bottom-0 left-0 right-0 text-black bg-white overflow-auto lg:hidden"
        v-if="showDropdown"
      >
        <div class="p-5 flex flex-col space-y-2">
          <a
            v-for="item in navLinks"
            target="_blank"
            class="flex"
            rel="nofollow noreferer"
            :href="item.link"
            :key="item.link"
            >{{ item.title }}</a
          >
        </div>
        <div class="border-b border-gray-300"></div>
        <div class="p-5">
          <DocsMenu />
        </div>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Head } from 'ream/head'
import DocsMenu from './DocsMenu.vue'

export default defineComponent({
  components: {
    DocsMenu,
    Head,
  },

  setup() {
    const route = useRoute()
    const showDropdown = ref(false)
    const navLinks = [
      {
        title: 'GitHub',
        link: 'https://github.com/ream/ream',
      },
      {
        title: 'Twitter',
        link: 'https://twitter.com/_egoistlily',
      },
    ]

    watch(
      () => route.path,
      () => {
        showDropdown.value = false
      }
    )

    return {
      showDropdown,
      navLinks,
    }
  },
})
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
