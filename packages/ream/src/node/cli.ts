import { cac } from 'cac'
import consola from 'consola'
import { version } from '../../package.json'

const DEFAULT_PORT = 4000

const cli = cac()

cli
  .command('[dir]', 'Serve a directory in dev mode', {
    ignoreOptionDefaultValue: true,
  })
  .alias('dev')
  .option('--host <host>', 'Server host (default: localhost)')
  .option('--port <port>', 'Server port (default: 3000)')
  .action(
    handleError(
      async (rootDir: string, options: { host?: string; port?: number }) => {
        const { Ream } = await import('./')
        const app = new Ream({
          rootDir,
          dev: true,
          host: options.host,
          port: options.port || DEFAULT_PORT,
        })
        await app.startServer()
      }
    )
  )

cli
  .command('build [dir]', 'Build a directory for production', {
    ignoreOptionDefaultValue: true,
  })
  .option('--mode <mode>', 'Set a custom mode for your app')
  .option('--standalone', 'Bundle external dependencies in server code')
  .action(
    handleError(
      async (
        rootDir: string,
        flags: { standalone?: boolean; mode?: string }
      ) => {
        const { Ream } = await import('./')
        const app = new Ream({
          rootDir,
          mode: flags.mode,
          dev: false,
        })
        await app.build({ standalone: flags.standalone })
      }
    )
  )

cli
  .command('export [dir]', 'Export a hybrid site to a static site')
  .option('--mode <mode>', 'Set a custom mode for your app')
  .action(
    handleError(async (rootDir: string, flags: { mode?: string }) => {
      const { Ream } = await import('./')
      const app = new Ream({
        rootDir,
        mode: flags.mode,
        dev: false,
      })
      await app.build({ fullyExport: true }).catch(handleError)
    })
  )

cli
  .command('start [dir]', 'Start a production server')
  .option('--host <host>', 'Server host (default: localhost)')
  .option('--port <port>', 'Server port (default: 3000)')
  .action(
    handleError(
      async (rootDir = '.', options: { host?: string; port?: number }) => {
        const { Ream } = await import('./')
        const app = new Ream({
          rootDir,
          dev: false,
          host: options.host,
          port: options.port || DEFAULT_PORT,
        })
        await app.startServer()
      }
    )
  )

cli.version(version)
cli.help()
cli.parse()

function handleError(fn: (...args: any[]) => Promise<void>) {
  return async (...args: any[]) => {
    try {
      await fn(...args)
    } catch (error) {
      consola.error(error)
      process.exitCode = 1
    }
  }
}
