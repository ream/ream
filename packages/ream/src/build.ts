import { Ream } from '.'
import { getViteConfig } from './vite/get-vite-config'
import { build as viteBuild } from 'vite'

export async function build(api: Ream) {
  await Promise.all([
    viteBuild(getViteConfig(api, true)),
    viteBuild(getViteConfig(api, false)),
  ])
}
