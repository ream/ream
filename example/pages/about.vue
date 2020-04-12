<template>
  <div>
    <h1>about</h1>
    <p>
      <router-link to="/">Home</router-link>
    <strong>{{msg}}</strong>
    </p>
  </div>
</template>

<script>
export const getServerSideProps = () => {
  return {
    props: {
      msg: 'hello abput'
    }
  }
}

export default {
  props: ['msg']
}
</script>