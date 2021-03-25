import fs from 'fs'
import { build as esbuild } from 'esbuild'
import { Ream } from '.'
import consola from 'consola'
import chalk from 'chalk'
import { getViteConfig } from './vite/get-vite-config'
import { build as viteBuild } from 'vite'

export async function build(api: Ream) {
  const serverConfig = getViteConfig(api, true)
  const clientConfig = getViteConfig(api, false)
  await viteBuild(serverConfig)
  await viteBuild(clientConfig)
}

export async function buildStandalone(api: Ream) {
  const clientManifest = await fs.promises.readFile(
    api.resolveDotReam('manifest/client-manifest.json'),
    'utf8'
  )
  const ssrManifest = await fs.promises.readFile(
    api.resolveDotReam('manifest/ssr-manifest.json'),
    'utf8'
  )
  const exportManifest = await fs.promises
    .readFile(api.resolveDotReam('manifest/export-manifest.json'), 'utf8')
    .catch(() => `{}`)
  const htmlTemplate = await fs.promises.readFile(
    api.resolveDotReam('client/index.html'),
    'utf8'
  )

  await fs.promises.writeFile(
    api.resolveDotReam('server/standalone.js'),
    `
  import {createHandler as _createHandler} from 'ream/server'

  const serverEntry = require('./server-entry')

  export const createHandler = (cwd) => _createHandler({
    cwd,
    clientManifest: ${clientManifest},
    ssrManifest: ${ssrManifest},
    exportManifest: ${exportManifest},
    serverEntry,
    htmlTemplate: ${JSON.stringify(htmlTemplate)}
  })
  `
  )

  const inputFile = api.resolveDotReam('server/standalone.js')
  const outFile = api.resolveDotReam('server/standalone-bundle.js')
  const { warnings } = await esbuild({
    entryPoints: [inputFile],
    outfile: outFile,
    bundle: true,
    format: 'cjs',
    platform: 'node',
    minify: !process.env.DEBUG,
    logLevel: 'error',
    target: 'es2018',
  })
  for (const warning of warnings) {
    if (
      !warning.text.includes('Indirect calls to "require" will not be bundled')
    ) {
      consola.warn(chalk.bold(warning.text))
      if (warning.location) {
        console.log(
          `${warning.location.file}:${warning.location.line}:${warning.location.column}`
        )
        console.log(warning.location.lineText)
      }
    }
  }
}
