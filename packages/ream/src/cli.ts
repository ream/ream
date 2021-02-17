#!/usr/bin/env node
import { cac } from 'cac'

const cli = cac()

cli
  .command('[dir]', 'Serve a directory in dev mode', {
    ignoreOptionDefaultValue: true,
  })
  .option('--no-cache', 'Disable webpack caching')
  .option('--port <port>', 'Server port')
  .action(async (rootDir, options) => {
    const { Ream } = await import('./')
    const app = new Ream({
      rootDir,
      dev: true,
      server: {
        port: options.port,
      },
    })
    await app.serve().catch(handleError)
  })

cli
  .command('build [dir]', 'Build a directory for production', {
    ignoreOptionDefaultValue: true,
  })
  .action(async (rootDir, options) => {
    const { Ream } = await import('./')
    const app = new Ream({
      rootDir,
      dev: false,
    })
    await app.build().catch(handleError)
  })

cli
  .command('export [dir]', 'Export a hybrid site to a static site')
  .action(async (rootDir) => {
    const { Ream } = await import('./')
    const app = new Ream({
      rootDir,
      dev: false,
    })
    await app.build(true).catch(handleError)
  })

cli
  .command('start [dir]', 'Start a production server')
  .option('--port <port>', 'Server port')
  .action(async (rootDir, options) => {
    const { Ream } = await import('./')
    const app = new Ream({
      rootDir,
      dev: false,
      server: {
        port: options.port,
      },
    })
    await app.serve()
  })

cli.version(require('../package').version)
cli.help()
cli.parse()

function handleError(error: Error) {
  require('consola').error(error)
  process.exit(1)
}
