<script lang="ts">
import { defineComponent, PropType, onMounted, ref } from 'vue'
import type { Load } from 'ream/app'
import { loadItem, Item } from '@/lib/hn'
import { formatTime } from '@/lib/date'

type Props = {
  item: Item
}

export const load: Load<Props> = async ({ params }) => {
  const item = await loadItem(Number(params.id))

  return {
    props: {
      item,
    },
  }
}

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<Props['item']>,
      required: true,
    },
  },

  setup({ item }) {
    const commentsLoaded = ref(false)
    const comments = ref<Item[]>([])

    const loadComments = async () => {
      comments.value = await Promise.all(
        item.kids.slice(0, 20).map(async (id) => {
          return loadItem(id)
        })
      )
      commentsLoaded.value = true
    }

    onMounted(() => {
      loadComments()
    })

    return {
      formatTime,
      comments,
      commentsLoaded,
    }
  },
})
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div class="bg-white p-5">
      <h2 class="text-2xl">{{ item.title }}</h2>
      <div class="mt-2 text-gray-500 text-sm">
        <span>{{ item.score }} points</span>
        <span class="mx-1.5">|</span>
        <span
          >by
          <router-link :to="`/user/${item.by}`" class="underline">{{
            item.by
          }}</router-link></span
        >
        <span class="ml-1">{{ formatTime(item.time) }}</span>
      </div>
    </div>

    <div class="mt-5 bg-white">
      <div class="px-5 py-3 border-b">{{ item.descendants }} comments</div>
      <div class="px-5 py-3 text-sm" v-if="!commentsLoaded">
        Loading comments..
      </div>
      <div class="divide-y">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="p-5 text-gray-600"
        >
          <div class="mb-2">
            <router-link
              :to="`/user/${item.by}`"
              class="underline font-medium text-gray-500"
            >
              {{ comment.by }}
            </router-link>
            <span class="ml-2 text-sm">{{ formatTime(comment.time) }}</span>
          </div>
          <div class="prose prose-sm max-w-full" v-html="comment.text"></div>
        </div>
      </div>
    </div>
  </div>
</template>
