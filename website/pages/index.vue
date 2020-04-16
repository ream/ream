<template>
  <div>
    <Header />
    <div class="main">
      <div class="container mx-auto my-32" style="min-height: 40vh;">
        <h2 class="text-4xl">
          A Vue framework for build
          <span class="text-blue-700">server-rendered</span> or
          <span class="text-blue-700">static</span> websites.
        </h2>
        <h3 class="text-2xl text-red-500 mt-3">This website is still a work-in-progress, read with caution.</h3>
        <div class="my-8">
          <router-link
            to="/docs/getting-started"
            class="bg-blue-500 hover:bg-blue-700 text-white rounded-lg h-12 items-center inline-flex px-5"
          >Documentation</router-link>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script>
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

export default {
  components: {
    Header,
    Footer,
  },
}
</script>