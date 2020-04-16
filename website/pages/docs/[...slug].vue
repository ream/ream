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
import glob from 'fast-glob'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import { GetStaticProps, GetStaticPaths } from 'ream-server'

const docsDir = join(__dirname, '../../docs')

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
    join(docsDir, `${slug}.md`),
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

export const getStaticPaths: GetStaticPaths = async () => {
  const files = await glob('**/*.md', {
    cwd: docsDir,
  })
  return {
    paths: files.map(file => ({
      params: {
        slug: file.replace(/\.md$/, ''),
      },
    })),
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