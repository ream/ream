import { ReamServerRequest, ReamServerResponse } from './server'

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
      /**
       * Update the cached result in specific seconds
       * Only apply to staticPreload
       */
      revalidate?: number
    }
  | { notFound: true }
  | { error: { statusCode: number; stack?: string } }
  | { redirect: string | { url: string; permanent?: boolean } }

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

export type GetStaticPathsResult = {
  paths: Array<{
    params: {
      [k: string]: string
    }
  }>
  /**
   * pages not included in prerendered paths will result in the 404 page
   * set `fallback` to `true` to render those pages on the first request instead
   * in the background, Ream will statically generate the requested path HTML and JSON
   * and subsequent requests to the same path will serve the generated page
   */
  fallback?: boolean
}

export type GetStaticPaths = () =>
  | GetStaticPathsResult
  | Promise<GetStaticPathsResult>
