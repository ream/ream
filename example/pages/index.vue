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
  props: ['hello', 'msg'],

  data() {
    return {
      count: 0
    }
  }
}

export const getServerSideProps = () => {
  throw new Error('fuck!!sdf!!!')
  return {
    props: {
      hello: 'hello world'
    }
  }
};

export const getStaticProps = () => {
  return {
    props: {
      msg: 'try static props'
    }
  }
};
</script>

<style scoped>
div {
  background: red;
}
</style>