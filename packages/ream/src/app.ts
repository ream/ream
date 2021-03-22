export type ClientRoute = {
  name?: string
  path: string
  load: () => any
  children?: ClientRoute[]
}

export type ClientRoutes = ClientRoute[]

export type RenderContext = {
  url: string
  routes: ClientRoutes
  initialState: Record<string, any>
}

export type RenderResult = undefined | null | { html: string }

export type Render = (
  renderContext: RenderContext
) => RenderResult | Promise<RenderResult>
