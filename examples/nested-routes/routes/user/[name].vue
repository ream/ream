<script lang="ts">
import { defineComponent } from 'vue'
import { Load } from 'ream/app'

type Props = { message: string }

export const load: Load<Props> = ({ params }) => {
  return {
    props: {
      message: `hello ${params.name}`,
    },
  }
}

export default defineComponent({
  props: {
    message: {
      type: String,
      required: true,
    },
  },
})
</script>

<template>
  <div>{{ message }}</div>
</template>
