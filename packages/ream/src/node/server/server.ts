import { send, SendData, status } from './response-helpers'
import {
  connect,
  Connect,
  ConnectRequest,
  ConnectResponse,
  NextFunction,
  Options,
} from './connect'

export type ReamServerHandler = (
  req: ReamServerRequest,
  res: ReamServerResponse,
  next: NextFunction
) => void | Promise<void>

export interface ReamServerRequest extends ConnectRequest {
  url: string
  path: string
  params: {
    [k: string]: any
  }
  isLoadRequest?: boolean
}

export interface ReamServerResponse extends ConnectResponse {
  send: (data: SendData) => void
}

export type ReamServer = Connect<ReamServerRequest, ReamServerResponse>

export const createServer = (
  options?: Options<ReamServerRequest, ReamServerResponse>
) => {
  const app = connect<ReamServerRequest, ReamServerResponse>(options)

  app.use((req, res, next) => {
    req.isLoadRequest = req.path.endsWith('.load.json')

    Object.defineProperties(res, {
      send: {
        enumerable: true,
        value: function (data: SendData) {
          send(res, data)
          return res
        },
      },
      status: {
        enumerable: true,
        value: function (statusCode: number) {
          status(res, statusCode)
          return res
        },
      },
    })

    next()
  })

  return app
}
