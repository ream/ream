#!/usr/bin/env node
// @ts-check
const path = require('path')
const { cac } = require('cac')
const { majo } = require('majo')

async function main() {
  const cli = cac(`create-ream-app`)

  cli.command('[dir]', 'Create a new project in specific directory').action(
    /**
     *
     * @param {string | undefined} dir
     * @param {any} flags
     */
    async (dir, flags) => {
      if (!dir) {
        console.log(`Please specify a directory`)
        process.exit(1)
      }

      await majo()
        .source('**/*', { baseDir: path.join(__dirname, '../template') })
        .use((stream) => {
          stream.rename('_gitignore', '.gitignore')
          stream.rename('_package.json', 'package.json')
        })
        .dest(dir)

      console.log(`
  Success!

  Now run following commands to start a dev server:

  npm install
  npm run dev

  Needs more help?

  - Check out README.md
  - Check out the docs: https://ream.dev
      `)
    }
  )

  try {
    cli.parse(process.argv, { run: false })
    await cli.runMatchedCommand()
  } catch (error) {
    if (error.name === 'CACError') {
      console.error(error.message)
    } else {
      console.error(error.stack)
    }
    process.exitCode = 1
  }
}

main()
