#!/usr/bin/env node
import { cac } from 'cac'
import { createServer } from '.'

const cli = cac('ream-server')

const { options } = cli
  .option('--port <port>', 'Server port', {
    default: 3000,
  })
  .version(__REAM_SERVER_VERSION__)
  .help()
  .parse()

const server = createServer()

server.listen(options.port)
console.log(`> Listen at http://localhost:${options.port}`)