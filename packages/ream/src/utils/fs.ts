import path from 'path'
import fs from 'fs'

export const writeFile = (
  filepath: string,
  content: Buffer | string,
  encoding?: BufferEncoding | null
) => {
  fs.mkdirSync(path.dirname(filepath), { recursive: true })
  return fs.writeFileSync(filepath, content, encoding)
}

export const pathExists = (filepath: string): Promise<boolean> =>
  new Promise((resolve) => {
    fs.access(filepath, (err) => resolve(!err))
  })

export const writeFileIfChanged = (filepath: string, content: string) => {
  if (fs.existsSync(filepath)) {
    const prev = fs.readFileSync(filepath, 'utf8')
    if (prev === content) return
  }

  writeFile(filepath, content, 'utf8')
}
