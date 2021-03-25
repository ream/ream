import execa from 'execa'
import chalk from 'chalk'
import { PKG_TO_BUILD } from './shared'
import buildPromise from './build'

const log = (label: string, buffer: Uint8Array) => {
  const text = buffer.toString()
  if (text) {
    console.log(chalk.bold(`[${label}]`))

    console.log(text)
  }
}

const run = (name: string) =>
  new Promise((resolve) => {
    const cmd = execa('pnpm', ['run', 'dev', '--filter', name], {
      env: { ...process.env, FORCE_COLOR: '1', NPM_CONFIG_COLOR: 'always' },
      stdio: 'pipe',
    })

    cmd.on('exit', (code) => {
      process.exitCode = code || 0
    })
    cmd.stdout?.on('data', (data) => {
      resolve(true)
      log(name, data)
    })
    cmd.stderr?.on('data', (data) => {
      resolve(true)
      log(name, data)
    })
  })

async function main() {
  // Build first to ensure all .d.ts files exist
  await buildPromise
  console.log(`STARTING WATCHING`)
  for (const name of PKG_TO_BUILD) {
    await run(name)
  }
}

main()
