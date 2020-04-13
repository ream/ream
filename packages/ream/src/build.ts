import { Ream } from '.'
import { getWebpackConfig } from './webpack/get-webpack-config'
import webpack from 'webpack'
import { PageInterface, GetStaticPropsResult } from 'ream-server'
import { outputFile } from 'fs-extra'

function runCompiler(compiler: webpack.Compiler) {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) return reject(err)
      resolve(stats)
    })
  })
}

export async function build(api: Ream) {
  const clientConfig = getWebpackConfig('client', api)
  const serverConfig = getWebpackConfig('server', api)
  const clientCompiler = webpack(clientConfig)
  const serverCompiler = webpack(serverConfig)

  await Promise.all([runCompiler(clientCompiler), runCompiler(serverCompiler)])

  // Emit files to store results o getStaticProps
  const writeStaticProps = async (
    entryName: string,
    result: GetStaticPropsResult
  ) => {
    await outputFile(
      api.resolveDotReam(`staticprops/${entryName}.json`),
      JSON.stringify(result.props),
      'utf8'
    )
  }

  for (const route of api.routes) {
    const page: PageInterface = require(api.resolveDotReam(
      `server/${route.entryName}`
    ))
    const { getStaticProps, getStaticPaths } = page
    if (getStaticProps) {
      const hasParams = route.routePath.includes(':')
      if (hasParams && !getStaticPaths) {
        throw new Error(
          `Route "${route.routePath}" uses dynamic paramter but you didn't export "getStaticPaths" in the page component`
        )
      }
      if (hasParams && getStaticPaths) {
        const { paths } = await getStaticPaths()
        for (const path of paths) {
          const result = await getStaticProps({
            params: path.params,
          })
          await writeStaticProps(route.entryName, result)
        }
      }
      if (!hasParams) {
        const result = await getStaticProps({ params: {} })
        await writeStaticProps(route.entryName, result)
      }
    }
  }
}
