<template>
  <div>
    <DocsHeader />
    <div class="main">
      <div class="my-12">
        <h1 class="text-4xl">Build your next web app with Ream.</h1>
        <h2 class="text-2xl">Powered by Vue.js ✌🏻✌🏽✌🏿</h2>
        <div class="flex items-center justify-center mt-12">
          <router-link to="/docs" class="button mr-5 bg-themeColor text-white">Get Started</router-link>
          <a class="button" href="https://github.com/egoist/ream" target="_blank">GitHub</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DocsHeader from '~/components/DocsHeader.vue'

export default {
  components: {
    DocsHeader
  },

  head: {
    bodyAttrs: {
      // class: 'bg-gray-100'
    }
  }
}
</script>

<style scoped>
.main {
  margin-top: var(--docs-header-height);
  @apply text-center;
  @apply p-5;
}

.button {
  @apply rounded-lg;
  @apply shadow-lg;
  @apply px-5;
  @apply py-4;
  @apply text-lg;
  @apply font-semibold;
}
</style>