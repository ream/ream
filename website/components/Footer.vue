<template>
  <footer class="mt-12 border-t pt-10 border-gray-200">
    <div
      class="container mx-auto flex items-center text-gray-700"
    >&copy; 2020 Created by EGOIST (Kevin Titor).</div>
    <div class="container mx-auto mt-5 mb-12">
      <a href="https://vercel.com?utm_source=reamjs" rel="nofollow noreferer" target="_blank"><Vercel /></a>
    </div>
  </footer>
</template>

<script>
import Vercel from '@/components/Vercel.vue'

export default {
  components: {
    Vercel,
  },
}
</script>