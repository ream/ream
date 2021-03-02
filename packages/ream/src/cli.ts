import { cac } from 'cac'
import path from 'path'

const cli = cac()

cli
  .command('[dir]', 'Serve a directory in dev mode', {
    ignoreOptionDefaultValue: true,
  })
  .option('--host <host>', 'Server host (default: localhost)')
  .option('--port <port>', 'Server port (default: 3000)')
  .action(
    async (rootDir: string, options: { host?: string; port?: number }) => {
      const { Ream } = await import('./')
      const app = new Ream({
        rootDir,
        dev: true,
        host: options.host,
        port: options.port,
      })
      await app.serve().catch(handleError)
    }
  )

cli
  .command('build [dir]', 'Build a directory for production', {
    ignoreOptionDefaultValue: true,
  })
  .action(async (rootDir: string) => {
    const { Ream } = await import('./')
    const app = new Ream({
      rootDir,
      dev: false,
    })
    await app.build().catch(handleError)
  })

cli
  .command('export [dir]', 'Export a hybrid site to a static site')
  .action(async (rootDir: string) => {
    const { Ream } = await import('./')
    const app = new Ream({
      rootDir,
      dev: false,
    })
    await app.build(true).catch(handleError)
  })

cli
  .command('start [dir]', 'Start a production server')
  .option('--host <host>', 'Server host (default: localhost)')
  .option('--port <port>', 'Server port (default: 3000)')
  .action(async (rootDir = '.', options: { host?: string; port?: number }) => {
    const { start } = await import('@ream/server')
    const context = require(path.resolve(rootDir, '.ream/meta/server-context'))
    await start(rootDir, {
      host: options.host,
      port: options.port,
      context,
    })
  })

cli.version(require('../package').version)
cli.help()
cli.parse()

function handleError(error: Error) {
  require('consola').error(error)
  process.exit(1)
}
