import { join } from 'path'
import fs from 'fs'
import marked from 'marked'
import Prism from 'prismjs'

if (process.server) {
  require('prismjs/components/prism-json')
  require('prismjs/components/prism-bash')
}

const docsDir = join(__dirname, '../../../docs')

const handler: ReamServerHandler = async (req, res) => {
  const { slug } = req.params
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

export default handler
