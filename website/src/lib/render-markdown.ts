import path from 'path'
import fs from 'fs'
import marked from 'marked'
import Prism from 'prismjs'

import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'

const docsDir = path.join(import.meta.env.REAM_ROOT_DIR, '../docs')

export async function renderMarkdown(slug: string) {
  const file = path.join(docsDir, `${slug}.md`)

  if (!fs.existsSync(file)) {
    return false
  }

  const content = await fs.promises.readFile(file, 'utf8')

  const renderer = new marked.Renderer()
  const heading = renderer.heading
  const env = { title: '' }
  renderer.heading = function (text, level, raw, slugger) {
    if (level === 1) {
      env.title = text
      return ''
    }
    return heading.call(this, text, level, raw, slugger)
  }

  const html = marked(content, {
    renderer,
    highlight(input, lang) {
      let prismLang = Prism.languages[lang]
      if (!prismLang) {
        prismLang = Prism.languages.markup
        lang = 'markup'
      }
      return Prism.highlight(input, prismLang, lang)
    },
  })
  return {
    content: html,
    title: env.title,
  }
}
