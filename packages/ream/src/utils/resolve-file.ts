import { pathExists } from 'fs-extra'

export const resolveFile = async (files: string[]) => {
  for (const file of files) {
    if (await pathExists(file)) {
      return file
    }
  }
}
