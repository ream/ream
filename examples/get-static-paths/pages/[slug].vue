<script lang="ts">
import { defineComponent } from 'vue'
import { StaticPreload, GetStaticPaths, usePageData } from 'ream/app'

export const staticPreload: StaticPreload = ({ params }) => {
  return {
    data: {
      name: params.slug,
    },
  }
}

export const getStaticPaths: GetStaticPaths = () => {
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

export default defineComponent({
  setup() {
    const page = usePageData()
    return { page }
  },
})
</script>

<template>
  <div>hello {{ page.name }}</div>
</template>
