import {
  ReamServerHandler,
  ReamServerRequest,
  ReamServerResponse,
} from '@ream/server'

interface IParams {
  [k: string]: string
}

export interface PreloadContext {
  params: IParams
  req: ReamServerRequest
  res: ReamServerResponse
}

export type PreloadResult<TData> =
  | {
      /**
       * Page data
       */
      data: TData
    }
  | { notFound: true }
  | { error: { statusCode: number; stack?: string } }

type PreloadFactory<ContextType = any, ResultType = any> = (
  ctx: ContextType
) => ResultType | Promise<ResultType>

/**
 * Always preload data on the server-side
 */
export type Preload<
  TData extends { [key: string]: any } = { [key: string]: any }
> = PreloadFactory<PreloadContext, PreloadResult<TData>>

export type StaticPreloadContext = Omit<PreloadContext, 'req' | 'res'>

/**
 * For static export
 */
export type StaticPreload<
  TData extends { [key: string]: any } = { [key: string]: any }
> = PreloadFactory<StaticPreloadContext, PreloadResult<TData>>

export type StaticPathsResult = {
  paths: Array<{
    params: {
      [k: string]: string
    }
  }>
}

export type StaticPaths = () => StaticPathsResult | Promise<StaticPathsResult>

export { ReamServerHandler, ReamServerRequest, ReamServerResponse }
