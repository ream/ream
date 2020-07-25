interface IParams {
  [k: string]: string
}

export interface PreloadContext {
  params: IParams
}

export interface PreloadResult {
  [k: string]: any
}

type PreloadFactory<ContextType = any, ResultType = any> = (
  ctx: ContextType
) => ResultType | Promise<ResultType>

export type Preload = PreloadFactory<PreloadContext, PreloadResult>

/**
 * Always preload data on the server-side
 */
export type ServerPreload = PreloadFactory<PreloadContext, PreloadResult>

export {
  ReamServerHandler,
  ReamServerRequest,
  ReamServerResponse,
} from './server/server'
