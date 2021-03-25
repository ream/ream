<template>
  <div>{{ msg }}</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

export async function load() {
  return {
    props: {
      msg: 'hello world',
    },
  }
}

export default defineComponent({
  props: ['msg'],
  setup(props) {
    return {
      msg: computed(() => props.msg),
    }
  },
})
</script>
