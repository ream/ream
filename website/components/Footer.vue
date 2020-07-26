<template>
  <footer class="mt-12 border-t pt-10 border-gray-200 text-center">
    <div class="px-5">
      <div class="flex items-center justify-center text-gray-700">
        &copy; 2020 Created by EGOIST (Kevin Titor).
      </div>
      <div class="mt-5 mb-12 flex justify-center">
        <a
          href="https://vercel.com?utm_source=reamjs"
          rel="nofollow"
          target="_blank"
          ><Vercel
        /></a>
      </div>
    </div>
  </footer>
</template>

<script>
import { defineComponent } from 'vue'
import Vercel from '@/components/Vercel.vue'

export default defineComponent({
  components: {
    Vercel,
  },
})
</script>
