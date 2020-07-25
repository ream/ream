export interface GetInitialPropsContext {
  params: {
    [k: string]: string
  }
}

export type GetInitialPropsResult = {
  props: {
    [k: string]: any
  }
}

export type GetInitialProps = (
  ctx: GetInitialPropsContext
) => GetInitialPropsResult | Promise<GetInitialPropsResult>

export {
  ReamServerHandler,
  ReamServerRequest,
  ReamServerResponse,
} from './server/server'
