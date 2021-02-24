import semver from 'semver'
import fs from 'fs'
import execa from 'execa'

async function main() {
  const args = process.argv.slice(2)

  const version = args[0]
  const dryRun = args.includes('--dry-run')

  if (!version || !semver.valid(version)) {
    throw new Error(`Invalid version`)
  }

  if (dryRun) {
    console.log(`next version will be ${version}`)
    return
  }

  const names = fs.readdirSync('packages')

  for (const name of names) {
    await execa('npm', ['version', version], { cwd: `packages/${name}` })
    await execa('git', ['add', 'package.json'], { cwd: `packages/${name}` })
  }

  await execa('git', ['commit', '-m', 'chore(release): publish packages'])

  for (const name of names) {
    await execa('pnpm', ['publish'], { cwd: `packages/${name}` })
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
