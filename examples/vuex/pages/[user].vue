<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const user = computed(() => store.state.user)
</script>

<template>
  <div>
    <h1>{{ user.name }}</h1>
  </div>
</template>
