import {
  ReamServerHandler,
  ReamServerRequest,
  ReamServerResponse,
} from './server/server'

interface IParams {
  [k: string]: string
}

export interface PreloadContext {
  params: IParams
  req: ReamServerRequest
  res: ReamServerResponse
}

export interface PreloadResult {
  /**
   * Pass to page component as props
   */
  props: {
    [k: string]: any
  }
}

type PreloadFactory<ContextType = any, ResultType = any> = (
  ctx: ContextType
) => ResultType | Promise<ResultType>

export type Preload = PreloadFactory<PreloadContext, PreloadResult>

/**
 * Always preload data on the server-side
 */
export type ServerPreload = PreloadFactory<PreloadContext, PreloadResult>

export type StaticPreloadContext = Omit<PreloadContext, 'req' | 'res'>

/**
 * For static export
 */
export type StaticPreload = PreloadFactory<StaticPreloadContext, PreloadResult>

export type StaticPathsResult = {
  paths: Array<{
    params: {
      [k: string]: string
    }
  }>
}

export type StaticPaths = () => StaticPathsResult | Promise<StaticPathsResult>

export { ReamServerHandler, ReamServerRequest, ReamServerResponse }
