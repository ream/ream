<template>
  <div>hello {{ name }}</div>
</template>

<script lang="ts">
import { StaticPreload, StaticPaths } from 'ream'

export const staticPreload: StaticPreload = ({ params }) => {
  return {
    props: {
      name: params.slug,
    },
  }
}

export const staticPaths: StaticPaths = () => {
  return {
    paths: [
      { params: { slug: 'kevin' } },
      { params: { slug: 'ronaldo' } },
      {
        params: { slug: 'zidane' },
      },
    ],
  }
}

export default {
  props: ['name'],
}
</script>
