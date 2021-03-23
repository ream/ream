import execa from 'execa'

async function build() {
  const pkgs = ['ream', '@ream/framework-vue']
  for (const pkg of pkgs) {
    await execa('pnpm', ['run', 'build', '--filter', pkg], { stdio: 'inherit' })
  }
}

build()
