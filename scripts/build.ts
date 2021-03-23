import execa from 'execa'

async function build() {
  const pkgs = ['ream', '@ream/app', '@ream/test-utils']
  for (const pkg of pkgs) {
    await execa('pnpm', ['run', 'build', '--filter', pkg], { stdio: 'inherit' })
  }
}

build()
