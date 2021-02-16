<script setup lang="ts">
import { useHead } from 'ream/head'
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
        <h2 class="text-4xl">
          A Vue framework for building
          <span class="text-blue-700">server-rendered</span> or
          <span class="text-blue-700">static</span> websites.
        </h2>
        <h3 class="text-xl bg-red-500 rounded-lg text-white p-2 mt-3">
          This website is still a work-in-progress, read with caution.
        </h3>
        <div class="my-8 flex space-x-3 justify-center">
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
