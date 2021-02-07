import path from 'path'
import fs from 'fs-extra'
import type { ServerEntry } from '@ream/server'
import { render, getScripts } from '@ream/server'

export const exportSite = async (dotReamDir: string) => {
  const ssrManifest = require(path.join(
    dotReamDir,
    'manifest/ssr-manifest.json'
  ))
  const serverEntry: ServerEntry = require(path.join(
    dotReamDir,
    'server/server-entry.js'
  )).default
  const scripts = getScripts(dotReamDir)
  const exportPage = async (url: string) => {
    const result = await render({
      url,
      dotReamDir,
      ssrManifest,
      serverEntry,
      scripts,
    })
    const file = path.join(
      dotReamDir,
      'client',
      url.replace(/\/?$/, '/index.html')
    )
    await fs.outputFile(file, result.body, 'utf8')
  }

  await exportPage('/')
}
