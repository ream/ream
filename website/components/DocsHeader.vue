<template>
  <header class="docs-header fixed border-b z-40 top-0 left-0 right-0 text-gray-400">
    <div class="container mx-auto px-2 h-full flex items-center justify-between">
      <h1 class="text-xl">
        <router-link class="site-title" to="/">Ream</router-link>
      </h1>
      <div>
        <ul class="flex">
          <li class="ml-5">
            <router-link to="/">Home</router-link>
          </li>
          <li class="ml-5">
            <router-link to="/docs">Docs</router-link>
          </li>
        </ul>
      </div>
    </div>
  </header>
</template>

<style>
:root {
  --docs-header-height: 70px;
  --docs-header-bg: var(--theme-color);
}
</style>

<style scoped>
.docs-header a.router-link-exact-active {
  @apply text-white;
}

.docs-header {
  height: var(--docs-header-height);
  background: var(--docs-header-bg);
}

.docs-header a {
  color: inherit;
  transition: color .3s cubic-bezier(0.075, 0.82, 0.165, 1);
}

.docs-header a:hover {
  color: white;
}

.docs-header .site-title {
  color: white;
}
</style>