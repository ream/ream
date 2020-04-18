<template>
  <div>
    <Header />
    <div class="main">
      <div class="container mx-auto">
        <div class="flex lg:-mx-5">
          <div class="hidden lg:block lg:w-4/12 lg:px-5">
            <DocsMenu />
          </div>
          <div class="lg:w-8/12 lg:px-5">
            <h2 class="text-5xl font-semibold mb-5">{{ title }}</h2>
            <div class="markdown-body" v-html="content"></div>
          </div>
        </div>
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
import DocsMenu from '@/components/DocsMenu.vue'
import { GetStaticProps, GetStaticPaths } from 'ream-server'
import Prism from 'prismjs'

if (process.server) {
  require('prismjs/components/prism-json')
  require('prismjs/components/prism-bash')
}

const docsDir = join(__dirname, '../../../docs')

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
  const html = marked(content, { renderer, highlight(input, lang) {
    let prismLang = Prism.languages[lang]
    if (!prismLang) {
      prismLang = Prism.languages.markup
      lang = 'markup'
    }
    return Prism.highlight(input, prismLang, lang)
  } })
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
    DocsMenu,
  },

  props: ['content', 'title'],

  head() {
    return {
      title: `${this.title} - Ream Documentation`
    }
  }
}
</script>