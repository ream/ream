<template>
  <div>
    <Head>
      <title>{{ title }}</title>
    </Head>
    <Header />
    <aside
      class="sidebar fixed hidden lg:block p-5 bottom-0 left-0 overflow-y-auto"
    >
      <DocsMenu />
    </aside>
    <main class="page">
      <div class="max-w-3xl mx-auto p-5">
        <h2 class="text-5xl font-semibold mb-5">{{ page.title }}</h2>
        <div class="markdown-body" v-html="page.content"></div>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { StaticPreload } from 'ream'
import { Head } from 'ream/head'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import DocsMenu from '@/components/DocsMenu.vue'
import { renderMarkdown } from '@/lib/render-markdown'

export const staticPreload: StaticPreload = async ({ params }) => {
  const page = await renderMarkdown(params.slug)
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

<style scoped>
.sidebar {
  top: var(--header-height);
  width: var(--sidebar-width);
  @apply border-r;
  @apply border-gray-100;
}

.page {
  padding-top: var(--header-height);
}

@screen lg {
  .page {
    padding-left: var(--sidebar-width);
  }
}
</style>
