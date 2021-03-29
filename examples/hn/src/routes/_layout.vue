<script lang="ts">
import { defineComponent } from 'vue'
import Header from '@/components/Header.vue'

export default defineComponent({
  components: {
    Header,
  },
})
</script>

<template>
  <div>
    <Header />
    <ream-page></ream-page>
  </div>
</template>
