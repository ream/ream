import { send, SendData, status } from './response-helpers'
import {
  connect,
  ConnectRequest,
  ConnectResponse,
  NextFunction,
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
}

export interface ReamServerResponse extends ConnectResponse {
  send: (data: SendData) => void
}

export const createServer = () => {
  const app = connect<ReamServerRequest, ReamServerResponse>()

  app.use((req, res, next) => {
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
