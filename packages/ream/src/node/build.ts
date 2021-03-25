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
  const inputFile = api.resolveDotReam('meta/server-context.js')
  const outFile = api.resolveDotReam('meta/server-context-bundle.js')
  const { warnings } = await esbuild({
    entryPoints: [inputFile],
    outfile: outFile,
    bundle: true,
    format: 'cjs',
    platform: 'node',
    minify: !process.env.DEBUG,
    logLevel: 'error',
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
