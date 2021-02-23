import path from 'path'
import fs from 'fs'

export const outputFile = async (
  filepath: string,
  content: Buffer | string,
  encoding?: BufferEncoding | null
) => {
  await fs.promises.mkdir(path.dirname(filepath), { recursive: true })
  return fs.promises.writeFile(filepath, content, encoding)
}

export const readFile = fs.promises.readFile

export const pathExists = (filepath: string) =>
  new Promise((resolve) => {
    fs.access(filepath, (err) => resolve(!err))
  })
