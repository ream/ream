<template>
  <div>{{msg}}</div>
</template>

<script>
export async function getStaticProps() {
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