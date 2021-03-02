import path from 'path'
import { cac } from 'cac'

const cli = cac(`ream-server`)

cli
  .command('[cwd]', 'Start production server')
  .option('--host <host>', 'Server host (default: localhost)')
  .option('--port <port>', 'Server port (default: 3000)')
  .action(
    async (cwd: string = '.', options: { host?: string; port?: number }) => {
      const { start } = await import('./')
      const context = require(path.resolve(cwd, '.ream/meta/server-context'))
      await start(cwd, {
        host: options.host,
        port: options.port,
        context,
      })
    }
  )

cli.parse()
