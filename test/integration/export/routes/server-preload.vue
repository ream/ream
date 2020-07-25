<template>
  <div>{{ message }}</div>
</template>

<script>
export const serverPreload = () => {
  return { message: 'server preload' }
}

export default {
  props: ['message'],
}
</script>
