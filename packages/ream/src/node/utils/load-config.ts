import { resolveFile } from './resolve-file'
import { loadConfigFromFile } from 'vite'

export const SUPPORTED_CONFIG_FILES = [
  'ream.config.js',
  'ream.config.ts',
  'ream.config.mjs',
  'ream.config.cjs',
]

export async function loadConfig(cwd: string) {
  const file = await resolveFile(SUPPORTED_CONFIG_FILES, cwd)
  if (!file) return {}

  const resolved = await loadConfigFromFile(
    { command: 'build', mode: 'production' },
    file
  )
  return (resolved as { config?: any; path?: string }) || {}
}
