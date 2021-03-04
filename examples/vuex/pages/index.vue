<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  setup() {
    const store = useStore()
    return {
      count: computed(() => store.state.count),
      inc: () => store.commit('inc'),
    }
  },
})
</script>

<template>
  <div>
    <button @click="inc">{{ count }}</button>
  </div>
</template>
