import { cac } from 'cac'

const cli = cac(`ream-server`)

cli
  .command('[cwd]', 'Start production server')
  .option('-p, --port <port>', 'Server port')
  .action(async (cwd: string = '.', options: { port?: number }) => {
    const port = `${options.port || 3000}`
    process.env.PORT = port

    const { createServer } = await import('./')
    const server = await createServer({
      cwd,
    })
    server.listen(port)
    console.log(`> http://localhost:${port}`)
  })

cli.parse()
