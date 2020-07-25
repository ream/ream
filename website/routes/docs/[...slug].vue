<template>
  <Head>
    <title>{{ title }}</title>
  </Head>
  <div>
    <Header />
    <div class="main">
      <div class="container mx-auto">
        <div class="flex md:-mx-5">
          <div class="hidden md:block md:w-4/12 md:px-5">
            <DocsMenu />
          </div>
          <div class="md:w-8/12 md:px-5">
            <h2 class="text-5xl font-semibold mb-5">{{ page.title }}</h2>
            <div class="markdown-body" v-html="page.content"></div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { PreloadFunction } from 'ream'
import { fetch } from 'ream/fetch'
import { Head } from 'ream/head'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import DocsMenu from '@/components/DocsMenu.vue'

export const preload: PreloadFunction = async ({ params }) => {
  const res = await fetch(`/docs/${params.slug}.json`)
  const page = await res.json()
  return {
    props: {
      page,
    },
  }
}

export default defineComponent({
  components: {
    Header,
    Footer,
    DocsMenu,
    Head,
  },

  props: ['page'],

  setup({ page }) {
    return {
      title: `${page.title} - Ream Documentation`,
    }
  },
})
</script>
