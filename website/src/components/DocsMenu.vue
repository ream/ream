<template>
  <div class="sticky docs-menu">
    <div v-for="item in menu" :key="item.text">
      <div class="text-sm text-gray-500 uppercase mb-3 tracking-wide">
        {{ item.text }}
      </div>
      <div v-for="child in item.children" :key="child.text">
        <router-link
          class="menu-item-link"
          :class="{ active: $route.path === child.link }"
          :to="child.link"
          >{{ child.text }}</router-link
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import menu from '@/data/menu'

export default defineComponent({
  data() {
    return {
      menu,
    }
  },
})
</script>

<style scoped>
.docs-menu {
  top: 0;
}

.menu-item-link {
  @apply flex;
  @apply px-2;
  @apply py-2;
  @apply -ml-2;
  @apply -mr-2;
}

.menu-item-link.active {
  @apply bg-blue-50;
}

@screen md {
  .menu-item-link {
    @apply rounded;
  }
}
</style>
