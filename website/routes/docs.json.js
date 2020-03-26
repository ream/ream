import fs from 'fs'
import { promisify } from 'util'
import { join } from 'path'
import fm from 'front-matter'
import Markdown from 'markdown-it'
import Prism from 'prismjs'
import 'prismjs/components/prism-bash'

const readFile = promisify(fs.readFile)

const slugify = input =>
  input // Remove html tags
    .replace(/<(?:.|\n)*?>/gm, '') // Remove special characters
    .replace(/[!\"#$%&'\(\)\*\+,\/:;<=>\?\@\[\\\]\^`\{\|\}~]/g, '') // eslint-disable-line no-useless-escape
    // Replace dots and spaces with a short dash
    .replace(/(\s|\.)/g, '-') // Replace long dash with two short dashes
    .replace(/—/g, '--') // Make the whole thing lowercase
    .toLowerCase()

export default async (req, res) => {
  const contentDir = join(__dirname, '../content')
  const files = await promisify(fs.readdir)(contentDir)
  const md = new Markdown({
    html: true,
    highlight(str, lang) {
      return Prism.highlight(
        str,
        Prism.languages[lang] || Prism.languages.markup,
        lang
      )
    },
  })
  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const nextToken = tokens[idx + 1]
    const id = slugify(nextToken.content)
    token.attrSet('id', id)
    env.headings.push({
      level: token.markup.length,
      text: nextToken.content,
      id
    })
    return self.renderToken(tokens, idx, options)
  }
  const result = await Promise.all(
    files.map(async path => {
      const content = await readFile(join(contentDir, path), 'utf8')
      const parsed = fm(content)
      const env = { headings: [] }
      const html = md.render(parsed.body, env)
      return {
        path,
        slug: slugify(path.replace(/^[0-9]+\-/, '').replace(/\.md$/, '')),
        ...parsed.attributes,
        html,
        headings: env.headings
      }
    })
  )

  res.json(result)
}
