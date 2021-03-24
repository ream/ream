<script lang="ts">
import { defineComponent } from 'vue'
import { Preload, usePageData, useHead } from 'ream/app'
import Nav from '../components/Nav.vue'

type PageData = {
  date: string
}

export const staticPreload: Preload<PageData> = async () => {
  return {
    data: {
      date: new Date().toLocaleString(),
    },
  }
}

export default defineComponent({
  setup() {
    useHead({ title: `static preload` })

    const page = usePageData<PageData>()

    return { page }
  },

  components: { Nav },
})
</script>

<template>
  <div class="posts">
    <h1>It's {{ page.date }}</h1>
    <Nav />
  </div>
</template>
