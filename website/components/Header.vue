<template>
  <header class="header bg-blue-600 text-white fixed w-full top-0">
    <div class="container mx-auto flex h-full items-center justify-between">
      <h1 class="text-2xl font-bold">
        <router-link to="/">Ream</router-link>
      </h1>
      <div>
        <a target="_blank" rel="nofollow noreferer" href="https://github.com/egoist/ream">GitHub</a>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  height: var(--header-height);
}
</style>