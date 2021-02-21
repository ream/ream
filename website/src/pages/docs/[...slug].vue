<script lang="ts">
import { defineComponent, computed } from 'vue'
import type { StaticPreload } from '@ream/app'
import { renderMarkdown } from '@/lib/render-markdown'
import { useHead, usePageData } from '@ream/app'
import Header from '@/components/Header.vue'
import DocsMenu from '@/components/DocsMenu.vue'

export const staticPreload: StaticPreload = async ({ params }) => {
  const result = await renderMarkdown(params.slug)
  if (!result) {
    return { notFound: true }
  }
  return {
    data: result,
  }
}

export default defineComponent({
  components: {
    Header,
    DocsMenu,
  },

  setup() {
    const preloadData = usePageData()
    const title = computed(
      () => `${preloadData.value.title} - Ream Documentation`
    )

    useHead({
      title,
    })

    return { preloadData }
  },
})
</script>

<template>
  <div>
    <Header />
    <aside
      class="sidebar fixed hidden lg:block p-5 bottom-0 left-0 overflow-y-auto"
    >
      <DocsMenu />
    </aside>
    <main class="page">
      <div class="max-w-3xl mx-auto p-5">
        <h2 class="text-5xl font-semibold mb-5">{{ preloadData.title }}</h2>
        <div class="markdown-body" v-html="preloadData.content"></div>
      </div>
    </main>
  </div>
</template>

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
