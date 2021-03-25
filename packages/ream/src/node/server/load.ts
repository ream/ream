/**
 * Load on demand
 */
export interface LoadOptions {
  readonly params: Record<string, string | string[]>
  readonly query: Record<string, string | string[] | undefined>
  readonly path: string
  readonly host: string
  readonly headers: Record<string, string | string[] | undefined>
}

export type LoadResult<TProps = object> =
  | {
      /**
       * Page props
       */
      props?: TProps
      /**
       * 404
       */
      notFound?: true
      /**
       * Render error page
       */
      error?: { status: number; stack?: string }
      /**
       * Redirect to a URL
       */
      redirect?: string | { url: string; permanent?: boolean }
    }
  // 404
  | null
  // 404
  | undefined

export type Load<TData extends Record<string, any> = object> = LoadFactory<
  LoadOptions,
  LoadResult<TData>
>

type LoadFactory<ContextType = any, ResultType = any> = (
  ctx: ContextType
) => ResultType | Promise<ResultType>

export type PreloadOptions = Omit<LoadOptions, 'query' | 'headers'>

/**
 * Load at build time
 */

export type PreloadResult<TProps = object> = LoadResult<TProps> & {
  /**
   * Update the statically generated page in specific seconds
   */
  revalidate?: number
}

export type Preload<TProps extends Record<string, any> = object> = LoadFactory<
  PreloadOptions,
  PreloadResult<TProps>
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
