import { ReamServerRequest, ReamServerResponse } from './server'

interface IParams {
  [k: string]: string
}

export interface LoadContext {
  params: IParams
  req: ReamServerRequest
  res: ReamServerResponse
}

export type LoadResult<TProps> =
  | {
      /**
       * Page props
       */
      props: TProps
      /**
       * Update the cached result in specific seconds
       * Only apply to preload
       */
      revalidate?: number
    }
  | { notFound: true }
  | { error: { status: number; stack?: string } }
  | { redirect: string | { url: string; permanent?: boolean } }

type LoadFactory<ContextType = any, ResultType = any> = (
  ctx: ContextType
) => ResultType | Promise<ResultType>

/**
 * Load on demand
 */
export type Load<TData extends Record<string, any> = object> = LoadFactory<
  LoadContext,
  LoadResult<TData>
>

export type PreloadContext = Omit<LoadContext, 'req' | 'res'>

/**
 * Load at build time
 */
export type Preload<TProps extends Record<string, any> = object> = LoadFactory<
  PreloadContext,
  LoadResult<TProps>
>

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
