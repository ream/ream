<template>
  <div>
    <Header />
    <div class="main">
      <div class="container mx-auto">
        <h2 class="text-4xl font-semibold mb-5">{{ title }}</h2>
        <div class="markdown-body" v-html="content"></div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script lang="ts">
import { join } from 'path'
import fs from 'fs'
import marked from 'marked'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import { GetStaticProps } from 'ream-server'

export const getStaticProps: GetStaticProps = async ({ params: { slug } }) => {
  const renderer = new marked.Renderer()
  const heading = renderer.heading
  const env = { title: '' }
  renderer.heading = function(text, level, raw, slugger) {
    if (level === 1) {
      env.title = text
      return ''
    }
    return heading.call(this, text, level, raw, slugger)
  }

  const content = await fs.promises.readFile(
    join(__dirname, '../../docs', `${slug}.md`),
    'utf8'
  )
  const html = marked(content, { renderer })
  return {
    props: {
      content: html,
      title: env.title,
    },
  }
}

export default {
  components: {
    Header,
    Footer,
  },

  props: ['content', 'title'],
}
</script>