import { join } from 'path'
import { Ream } from '.'
import * as ReamServerTypes from 'ream-server'
import { outputFile, copy, pathExists } from 'fs-extra'
import { compileToPath } from '@ream/common/dist/route-helpers'
import { Route } from '@ream/common/dist/route'

export async function writeStaticFiles(api: Ream) {
  const { ReamServer, renderToHTML }: typeof ReamServerTypes = require(api.resolveDotReam('server/ream-server.js'))
  const rs = new ReamServer()
  const renderer = rs.createRenderer()

  // Emit files to store results of getStaticProps
  const writeStaticProps = async (
    path: string,
    result: ReamServerTypes.GetStaticPropsResult
  ) => {
    await outputFile(
      api.resolveDotReam(
        `staticprops${path === '/' ? '/index' : path}.pageprops.json`
      ),
      JSON.stringify(result.props),
      'utf8'
    )
  }

  const staticOutDir = api.resolveRoot('out')

  const writeHtmlFile = async ({
    path,
    route,
    params,
  }: {
    path: string
    route: Route
    params: any
  }) => {
    if (api.config.target !== 'static') {
      return
    }

    const html = await renderToHTML(
      renderer,
      {
        path,
        url: path,
        getServerSidePropsContext: false,
        getStaticPropsContext: {
          params,
        },
      },
      route.entryName
    )
    const filename =
      path === `/`
        ? `/index.html`
        : path.endsWith('.html')
        ? path
        : `${path}/index.html`
    const outputPath = join(staticOutDir, filename)
    await outputFile(outputPath, `<!DOCTYPE html>${html}`, 'utf8')
  }

  if (api.config.target === 'static') {
    await copy(api.resolveDotReam('client'), join(staticOutDir, '_ream'))
  }

  try {
    const { routes: allRoutes } = renderer.runner.evaluate(`main.js`)

    for (const route of api.routes) {
      if (!route.isClientRoute) {
        continue
      }

      const page: ReamServerTypes.PageInterface = await allRoutes[route.entryName]()

      const { getStaticProps, getStaticPaths } = page
      // Use static path for 404 page
      if (route.is404) {
        route.routePath = '/404.html'
      }
      const hasParams = route.routePath.includes(':')
      if (hasParams && getStaticProps && !getStaticPaths) {
        throw new Error(
          `Route "${route.routePath}" uses dynamic paramter but you didn't export "getStaticPaths" in the page component`
        )
      }
      if (hasParams && getStaticProps && getStaticPaths) {
        const { paths } = await getStaticPaths()
        for (const path of paths) {
          const actualPath = compileToPath(route.routePath, path.params)
          if (getStaticProps) {
            const result = await getStaticProps({
              params: path.params,
            })
            await writeStaticProps(actualPath, result)
          }
          await writeHtmlFile({
            path: actualPath,
            params: path.params,
            route,
          })
        }
      }
      if (!hasParams) {
        if (getStaticProps) {
          const result = await getStaticProps({ params: {} })
          await writeStaticProps(route.entryName, result)
        }
        await writeHtmlFile({
          path: route.routePath,
          params: {},
          route,
        })
      }
    }
  } catch (err) {
    renderer.rewriteErrorTrace(err)
    console.error(err)
    throw err
  }

  if (api.config.target === 'static') {
    const staticPropsDir = api.resolveDotReam('staticprops')
    if (await pathExists(staticPropsDir)) {
      await copy(staticPropsDir, staticOutDir)
    }
  }
}
