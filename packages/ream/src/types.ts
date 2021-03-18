import { PluginContext } from './plugin-context'

export type OnFileChangeCallback<This = null> = (
  this: This,
  event: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir',
  filepath: string
) => any

export type Route = {
  /** A unique id of this route, for example you can use filepath as the id */
  id?: string
  name: string
  path: string
  file: string

  // An internal key that's used to make nested routes
  // You won't need this
  _nest_key_?: string
}

export type TransformServerExports = (
  this: PluginContext,
  code: string
) => string | Promise<string>

export type TransformCommonExports = (
  this: PluginContext,
  code: string
) => string | Promise<string>

export type GetClientRoutes = (
  this: PluginContext
) => Route[] | Promise<Route[]>

export type GetApiRoutes = (this: PluginContext) => Route[] | Promise<Route[]>

export type ReamPlugin = {
  name: string

  transformServerExports?: TransformServerExports

  transformCommonExports?: TransformCommonExports

  getClientRoutes?: GetClientRoutes

  getApiRoutes?: GetApiRoutes

  onFileChange?: OnFileChangeCallback<PluginContext>
}
