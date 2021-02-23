import execa from 'execa'

async function build() {
  const pkgs = ['@ream/server', 'ream', '@ream/test-utils']
  for (const pkg of pkgs) {
    await execa('yarn', ['workspace', pkg, 'build'])
  }
}

build()
