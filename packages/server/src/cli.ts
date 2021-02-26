import { cac } from 'cac'

const cli = cac(`ream-server`)

cli
  .command('[cwd]', 'Start production server')
  .option('-p, --port <port>', 'Server port')
  .action(async (cwd: string = '.', options: { port?: number }) => {
    const { start } = await import('./')
    await start(cwd, options)
  })

cli.parse()
