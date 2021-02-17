<template>
  <div class="posts">
    <h1>It's {{ page.date }}</h1>
    <Nav />
  </div>
</template>

<script lang="ts">
import type { Preload } from 'ream'

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
</script>

<script setup lang="ts">
import { usePreloadData } from '@ream/app'
import { useHead } from '@ream/app'
import Nav from '../components/Nav.vue'

const page = usePreloadData<PageData>()

useHead({ title: `static preload` })
</script>
