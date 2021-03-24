import { dirname } from 'path'
import { fileURLToPath } from 'url'

export const getDirname = (url: string) => dirname(fileURLToPath(url))
