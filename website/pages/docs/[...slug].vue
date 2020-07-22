<template>
  <div>
    <Header />
    <div class="main">
      <div class="container mx-auto">
        <div class="flex md:-mx-5">
          <div class="hidden md:block md:w-4/12 md:px-5">
            <DocsMenu />
          </div>
          <div class="md:w-8/12 md:px-5">
            <h2 class="text-5xl font-semibold mb-5">{{ title }}</h2>
            <div class="markdown-body" v-html="content"></div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script lang="ts">
import { join } from 'path'

import { PreloadFunction } from 'ream'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import DocsMenu from '@/components/DocsMenu.vue'

export const preload: PreloadFunction = async ctx => {
  const res = await ctx.fetch('/docs/:slug')
  return {
    props: res.json(),
  }
}

export default {
  components: {
    Header,
    Footer,
    DocsMenu,
  },

  props: ['content', 'title'],

  head() {
    return {
      title: `${this.title} - Ream Documentation`,
    }
  },
}
</script>
