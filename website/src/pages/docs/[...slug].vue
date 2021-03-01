<script lang="ts">
import path from 'path'
import glob from 'fast-glob'
import { defineComponent, computed } from 'vue'
import type { StaticPreload, GetStaticPaths } from '@ream/app'
import { renderMarkdown } from '@/lib/render-markdown'
import { useHead, usePageData } from '@ream/app'
import Header from '@/components/Header.vue'
import DocsMenu from '@/components/DocsMenu.vue'

export const staticPreload: StaticPreload = async ({ params }) => {
  console.log(`Rendering`)
  const result = await renderMarkdown(params.slug)
  if (!result) {
    return { notFound: true }
  }
  return {
    data: result,
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const files = await glob('**/*.md', {
    cwd: path.join(import.meta.env.REAM_ROOT_DIR, '../docs'),
  })
  return {
    paths: files.map((file) => ({ params: { slug: file.replace('.md', '') } })),
  }
}

export default defineComponent({
  components: {
    Header,
    DocsMenu,
  },

  setup() {
    const preloadData = usePageData()

    const title = computed(() => {
      return `${preloadData.value.title} - Ream Documentation`
    })

    useHead({
      title,
    })

    const ContentComponent = computed(() =>
      defineComponent({
        name: 'ContentComponent',
        template: `<div class="markdown-body">${preloadData.value.content}</div>`,
      })
    )

    return { preloadData, ContentComponent }
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
      <div class="max-w-3xl mx-auto p-5 mt-5">
        <div
          class="bg-yellow-100 text-yellow-800 font-bold rounded-lg px-3 py-2 text-sm flex items-center space-x-2"
        >
          <svg
            class="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span>Ream is not production ready, yet.</span>
        </div>
      </div>
      <div class="max-w-3xl mx-auto p-5">
        <h2 class="text-5xl font-semibold mb-5">{{ preloadData.title }}</h2>
        <component :is="ContentComponent" />
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
