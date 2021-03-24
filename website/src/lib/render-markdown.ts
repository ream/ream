import path from 'path'
import fs from 'fs'
import marked from 'marked'
import Prism from 'prismjs'

import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-typescript'

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

  const renderCode = renderer.code.bind(renderer)
  renderer.code = function (code, info, escaped) {
    return renderCode(code, info, escaped).replace('<pre>', '<pre v-pre>')
  }

  renderer.codespan = (text) => `<code v-pre>${text}</code>`

  const renderLink = renderer.link.bind(renderer)
  renderer.link = (href, title, text) => {
    let res = renderLink(href, title, text)
    if (!href || /^https?:/.test(href)) {
      return res
    }
    return res
      .replace('<a ', '<router-link ')
      .replace('href=', 'to=')
      .replace('</a>', '</router-link>')
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
