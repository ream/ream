<script setup lang="ts">
import { useHead } from '@ream/app'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

useHead({
  title: `Ream - A Vue 3 framework for building amazing apps`,
})
</script>

<template>
  <div>
    <Header />
    <div class="main">
      <div class="max-w-2xl text-center mx-auto my-32 px-5">
        <h1 class="text-5xl">Ream</h1>
        <h2 class="text-3xl mt-5 opacity-75">
          A Vue framework for building
          <span class="text-blue-700">server-rendered</span> or
          <span class="text-blue-700">static</span> websites.
        </h2>
        <div class="my-10 flex space-x-3 justify-center">
          <router-link
            to="/docs/getting-started"
            class="bg-blue-500 hover:bg-blue-700 text-white rounded-lg h-12 items-center inline-flex px-5"
            >Documentation</router-link
          >
          <a
            href="https://github.com/sponsors/egoist"
            target="_blank"
            class="bg-pink-500 hover:bg-pink-700 text-white rounded-lg h-12 items-center inline-flex px-5"
            rel="nofollow noopenner"
            >Sponsor</a
          >
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>
