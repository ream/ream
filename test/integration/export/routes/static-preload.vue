<template>
  <div>{{ message }}</div>
</template>

<script>
export const staticPreload = () => {
  return { message: 'static preload' }
}

export default {
  props: ['message'],
}
</script>
