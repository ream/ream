<template>
  <div class="docs-main px-2 py-5 lg:py-12">
    <div
      class="doc-item bg-white rounded-lg shadow p-5 lg:p-12 mt-12 lg:mt-40 first:mt-0"
      v-for="item in docItems"
      :key="item.path"
      :id="item.slug"
    >
      <h1 class="doc-title">{{item.title}}</h1>
      <div class="rich-text" v-html="item.html"></div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['docItems'],
}
</script>

<style>
.doc-title {
  @apply text-3xl;
  @apply mb-2;
  @apply leading-none;
  @apply mb-8;
}

.rich-text h2 {
  @apply text-2xl;
  @apply mt-12;
  @apply mb-4;
}

.rich-text h2 + * {
  @apply mt-0;
}

.rich-text hr {
  height: 2px;
  @apply my-8;
  @apply bg-gray-200;
  @apply border-0;
}

.rich-text pre {
  @apply my-8;
  @apply bg-gray-900;
  @apply text-gray-300;
  @apply rounded-lg;
  @apply p-5;
  @apply overflow-x-auto;
}

.rich-text :not(pre) code {
  @apply bg-brown-lightest;
  @apply text-sm;
  @apply rounded;
  @apply p-1;
  @apply text-indigo-600;
}

.rich-text ul {
  @apply list-disc;
  @apply pl-4;
  @apply my-4;
}

.rich-text p {
  @apply my-4;
}
</style>

<style scoped>
.docs-main {
  margin-top: var(--docs-header-height);
  width: 100%;
}

@screen lg {
  .docs-main {
    margin-left: var(--docs-sidebar-width);
  }
}
</style>