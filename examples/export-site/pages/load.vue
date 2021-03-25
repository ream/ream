<script lang="ts">
import { computed, defineComponent } from 'vue'

export async function load() {
  return {
    props: {
      msg: 'static preload',
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

<template>
  <div>{{ msg }}</div>
</template>
