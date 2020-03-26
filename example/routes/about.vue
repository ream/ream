<template>
  <div>
    <h1>{{title}}</h1>

    <router-link to="/">Home</router-link>
  </div>
</template>

<script>
export const getServerSideProps = () => {
  return {
    props: {
      title: 'about',
    },
  }
}

export default {
  props: ['title'],
}
</script>