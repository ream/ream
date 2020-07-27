<template>
  <div>{{ msg }}</div>
</template>

<script>
export async function preload() {
  return {
    props: {
      msg: 'hello world',
    },
  }
}

export default {
  props: ['msg'],
}
</script>
