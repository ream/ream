<template>
  <div>{{ msg }}</div>
</template>

<script>
export async function getInitialProps() {
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
