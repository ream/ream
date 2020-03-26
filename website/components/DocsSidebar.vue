<template>
  <div class="docs-sidebar fixed bottom-0 hidden lg:block overflow-auto px-2">
    <ul class="docs-sidebar-inner py-12 top-0">
      <li v-for="item in docItems" :key="item.path" class="mt-12 first:mt-0">
        <router-link
          :to="{hash: item.slug}"
          class="uppercase text-gray-600 font-medium text-sm"
        >{{item.title}}</router-link>
        <ul class="mt-2">
          <li v-for="heading in item.headings" :key="`${item.path}-${heading.id}`">
            <router-link :to="{hash: heading.id}">{{heading.text}}</router-link>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: ['docItems'],
}
</script>

<style>
:root {
  --docs-sidebar-width: 280px;
}

.docs-sidebar {
  width: var(--docs-sidebar-width);
  top: var(--docs-header-height);
}

.docs-sidebar-inner {

}
</style>