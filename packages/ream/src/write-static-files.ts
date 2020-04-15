import { join } from 'path'
import { Ream } from '.'
import * as ReamServer from 'ream-server'
import { outputFile, copy } from 'fs-extra'
import { compileToPath } from '@ream/common/dist/route-helpers'
import { Route } from '@ream/common/dist/route'

export async function writeStaticFiles(api: Ream) {
  const reamServer: typeof ReamServer = require(api.resolveDotReam('server/ream-server.js'))

  // Emit files to store results of getStaticProps
  const writeStaticProps = async (
    entryName: string,
    result: ReamServer.GetStaticPropsResult
  ) => {
    await outputFile(
      api.resolveDotReam(`staticprops/${entryName}.json`),
      JSON.stringify(result.props),
      'utf8'
    )
  }

  const staticOutDir = api.resolveRoot('out')

  const writeHtmlFile = async ({
    path,
    page,
    route,
    params,
  }: {
    path: string
    page: ReamServer.PageInterface
    route: Route
    params: any
  }) => {
    if (api.target !== 'static') {
      return
    }

    const buildDir = api.resolveDotReam()
    const { _document, _app, clientManifest } = reamServer.getServerAssets()
    const html = await reamServer.renderToHTML(page, {
      pageEntryName: route.entryName,
      path,
      originalPath: route.routePath,
      url: path,
      clientManifest,
      _app,
      _document,
      getServerSidePropsContext: false,
      getStaticPropsContext: {
        params,
      },
    })
    const filename =
      path === `/`
        ? `/index.html`
        : path.endsWith('.html')
        ? path
        : `${path}/index.html`
    const outputPath = join(staticOutDir, filename)
    await outputFile(outputPath, `<!DOCTYPE html>${html}`, 'utf8')
  }

  if (api.target === 'static') {
    await copy(api.resolveDotReam('client'), join(staticOutDir, '_ream'))
  }

  for (const route of api.routes) {
    if (!route.isClientRoute) {
      continue
    }
    const page: ReamServer.PageInterface = require(api.resolveDotReam(
      `server/${route.entryName}`
    ))
    const { getStaticProps, getStaticPaths } = page
    // Use static path for 404 page
    if (route.entryName === 'pages/404') {
      route.routePath = '/404.html'
    }
    const hasParams = route.routePath.includes(':')
    if (hasParams && !getStaticPaths) {
      throw new Error(
        `Route "${route.routePath}" uses dynamic paramter but you didn't export "getStaticPaths" in the page component`
      )
    }
    if (hasParams && getStaticPaths) {
      const { paths } = await getStaticPaths()
      for (const path of paths) {
        if (getStaticProps) {
          const result = await getStaticProps({
            params: path.params,
          })
          await writeStaticProps(route.entryName, result)
        }
        await writeHtmlFile({
          page,
          path: compileToPath(route.routePath, path.params),
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
        page,
        path: route.routePath,
        params: {},
        route,
      })
    }
  }
}
