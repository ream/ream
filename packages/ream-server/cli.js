#!/usr/bin/env node
const { resolve } = require('path')
const { cac } = require('cac')

const cli = cac('ream-server')

cli
  .command('[dir]', 'Run production server')
  .option('--port <port>', 'Server port', {
    default: 3000,
  })
  .action((dir = '.', options) => {
    /** @type {import('.')}  */
    const { createServer } = require(resolve(dir, '.ream/server/ream-server'))
    const server = createServer()

    server.listen(options.port)
    console.log(`> Listen at http://localhost:${options.port}`)
  })

cli
  .version(require('./package').version)
  .help()
  .parse()
