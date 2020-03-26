#!/usr/bin/env node
import { createServer } from 'http'
import { cac } from 'cac'

const cli = cac()

cli
  .command('[dir]', 'Run dev server', { ignoreOptionDefaultValue: true })
  .option('--port [port]', 'Server port', { default: 3000 })
  .action(async (dir, options) => {
    const { Ream } = await import('./')
    const ream = new Ream({
      dev: true,
      dir,
      port: options.port,
    })
    await ream.prepare()
    const handler = ream.getRequestHandler()
    const server = createServer(handler)
    server.listen(ream.port)
    console.log(`Open http://localhost:${ream.port}`)
  })

cli.command('build [dir]', 'Build your app').action(async dir => {
  const { Ream } = await import('./')
  const ream = new Ream({
    dev: false,
    dir,
  })
  await ream.prepare()
  await ream.build()
})

cli.command('start [dir]', 'Serve an already built app', {ignoreOptionDefaultValue: true})
.option('--port [port]', 'Server port', {default: 3000})
.action(async (dir, options) => {
  const { Ream } = await import('./')
  const ream = new Ream({
    dev: false,
    dir,
    port: options.port
  })
  await ream.prepare()
  const handler = ream.getRequestHandler()
  const server = createServer(handler)
  server.listen(ream.port)
  console.log(`Open http://localhost:${ream.port}`)
})

cli
  .command('export [dir]', 'Export an already built app as static files')
  .action(async dir => {
    const { Ream } = await import('./')
    const ream = new Ream({
      dev: false,
      dir,
    })
    await ream.prepare()
    await ream.export()
  })

cli.help()
cli.version(require('../package').version)

cli.parse()
