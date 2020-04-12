<template>
  <div>
    <h1>home {{hello}}!!!</h1>
    <button @click="count++">{{count}}</button>
    <p>
      <router-link to="/about">About</router-link>
    </p>
  </div>
</template>

<script>
export default {
  props: ['hello'],

  data() {
    return {
      count: 0
    }
  }
}

export const getServerSideProps = () => {
  return {
    props: {
      hello: 'hello world'
    }
  }
};
</script>

<style scoped>
div {
  background: red;
}
</style>