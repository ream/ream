import { Endpoint, Ream, Route } from '.'

export type OnFileChangeCallback = (
  ream: Ream,
  event: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir',
  filepath: string
) => any

export type ReamPlugin = {
  name: string

  /**
   * Before start dev server / bundling
   * Never call before starting production server
   */
  prepare?: (ream: Ream) => void | Promise<void>

  enhanceAppFiles?: (ream: Ream) => string[]

  enhanceServerFiles?: (ream: Ream) => string[]

  onFileChange?: OnFileChangeCallback

  pages?: (ream: Ream, routes: Route[]) => Route[]

  endpoints?: (ream: Ream, endpoints: Endpoint[]) => Endpoint[]
}
