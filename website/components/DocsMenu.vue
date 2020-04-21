<template>
  <div>
    <div v-for="item in menu" :key="item.text">
      <div class="text-sm text-gray-500 uppercase mb-3 tracking-wide">{{ item.text }}</div>
      <div v-for="child in item.children" :key="child.text">
        <router-link
          class="menu-item-link"
          :class="{active: $route.path === child.link}"
          :to="child.link"
        >{{ child.text }}</router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import menu from '@/data/menu'

export default {
  data() {
    return {
      menu,
    }
  },
}
</script>

<style scoped>
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