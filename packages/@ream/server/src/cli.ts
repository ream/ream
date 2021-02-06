#!/usr/bin/env node
import { cac } from 'cac'

const cli = cac(`ream-server`)

cli
  .command('[cwd]', 'Start production server')
  .action(async (cwd: string = '.') => {
    const { createServer } = await import('./')
    const server = await createServer({
      cwd,
    })
    server.listen(3000)
    console.log(`> http://localhost:3000`)
  })

cli.parse()
