import { spawn } from 'child_process'
import chalk from 'chalk'

const log = (label: string, buffer: Uint8Array) => {
  const text = buffer.toString()
  if (text) {
    console.log(chalk.bold(`[${label}]`))

    console.log(text)
  }
}

const run = (name: string) => {
  const cmd = spawn('npm', ['run', 'dev'], {
    cwd: `packages/${name}`,
    env: { ...process.env, FORCE_COLOR: '1', NPM_CONFIG_COLOR: 'always' },
  })

  cmd.on('exit', (code) => {
    process.exitCode = code || 0
  })
  cmd.stdout.on('data', (data) => {
    log(name, data)
  })
  cmd.stderr.on('data', (data) => {
    log(name, data)
  })
}

run('ream')
run('@ream/server')
run('@ream/test-utils')
