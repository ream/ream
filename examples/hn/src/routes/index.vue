<script lang="ts">
import { defineComponent } from 'vue'
import type { Load } from 'ream/app'
import Header from '@/components/Header.vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const HN_API = `https://hacker-news.firebaseio.com/v0`

const loadItem = async (id: number) => {
  const item = await fetch(`${HN_API}/item/${id}.json`).then((res) =>
    res.json()
  )
  return item
}

export const load: Load = async () => {
  const ids: number[] = await fetch(`${HN_API}/topstories.json`).then((res) =>
    res.json()
  )

  const items = await Promise.all(ids.slice(0, 20).map((id) => loadItem(id)))

  return {
    props: {
      items,
    },
  }
}

export default defineComponent({
  props: ['items'],

  components: {
    Header,
  },

  setup() {
    return { dayjs }
  },
})
</script>

<template>
  <div>
    <Header />
    <div class="bg-white max-w-3xl mx-auto mt-18 mb-6">
      <div class="divide-y">
        <div v-for="item in items" :key="item.id" class="p-5 pl-0 flex">
          <div
            class="w-16 text-orange-500 text-center flex items-center justify-center"
          >
            {{ item.score }}
          </div>
          <div>
            <h2>
              <a
                :href="item.url"
                target="_blank"
                rel="nofollow noopener"
                class="hover:text-orange-500"
                >{{ item.title }}</a
              >
            </h2>
            <div class="mt-1 text-gray-400 text-xs">
              by
              <router-link
                :to="`/user/${item.by}`"
                class="underline hover:text-orange-500"
                >{{ item.by }}</router-link
              >
              {{ dayjs(item.time * 1000).fromNow() }}
              |
              <router-link
                :to="`/item/${item.id}`"
                class="underline hover:text-orange-500"
                >{{ item.descendants }} comments</router-link
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
