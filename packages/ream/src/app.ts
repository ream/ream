export type ClientRoute = {
  name?: string
  path: string
  load: () => any
  children?: ClientRoute[]
}

export type ClientRoutes = ClientRoute[]

export type EntryContext = { routes: ClientRoutes }

export type ServerRenderContext = { url: string }

export type ServerRender = (
  renderContext: ServerRenderContext
) => Promise<undefined | null | { html: string }>

export type ClientRender = () => void

export type EntryResult = {
  serverRender?: ServerRender
  clientRender?: ClientRender
}
