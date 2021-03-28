<script lang="ts">
import { defineComponent } from 'vue'
import type { Load } from 'ream/app'

type Props = { title: string }

export const load: Load<Props> = () => {
  return {
    props: {
      title: 'user layout',
    },
  }
}

export default defineComponent({
  props: ['title'],
})
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <ul>
      <li>
        <router-link to="/user/egoist">egoist</router-link>
      </li>
      <li>
        <router-link to="/user/kevin">kevin</router-link>
      </li>
    </ul>
    <ream-page></ream-page>
  </div>
</template>
