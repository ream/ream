import execa from 'execa'
import { PKG_TO_BUILD } from './shared'

async function build() {
  console.log('START BUILDING')
  for (const pkg of PKG_TO_BUILD) {
    await execa('pnpm', ['run', 'build', '--filter', pkg], { stdio: 'inherit' })
  }
}

export default build()
