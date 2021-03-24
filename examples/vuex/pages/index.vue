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
    <ul>
      <li><router-link to="/egoist">egoist</router-link></li>
      <li><router-link to="/kevin">kevin</router-link></li>
    </ul>
    <button @click="inc">{{ count }}</button>
  </div>
</template>
