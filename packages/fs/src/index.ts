import {promisify} from 'util'
import fs from 'fs'
import mkdirp from 'mkdirp'
import {dirname} from 'path'

export const readFile = promisify(fs.readFile)

/**
 * Check if a file path exists
 * @param path 
 */
export const pathExists = (path: string): Promise<boolean> => new Promise(resolve => {
  fs.stat(path, error => {
    resolve(!error)
  })
})

export const writeFile = promisify(fs.writeFile)

/**
 * Like `writeFile` but also ensures that the directory exists before writing
 */
export const outputFile = async (path: string, content: string, encoding = 'utf8') => {
  const dir = dirname(path)
  const exists = await pathExists(dir)

  if (!exists) {
    await mkdirp(dir) 
  }

  await writeFile(path, content, encoding)
}