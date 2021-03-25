import { Ream } from '.'

export type OnFileChangeCallback = (
  this: Ream,
  event: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir',
  filepath: string
) => any

export type ReamPlugin = {
  name: string

  /**
   * Before start dev server / bundling
   * Never call before starting production server
   */
  prepare?: (this: Ream) => void | Promise<void>

  enhanceAppFiles?: (this: Ream) => string[]

  enhanceServerFiles?: (this: Ream) => string[]

  onFileChange?: OnFileChangeCallback
}
