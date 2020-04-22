import { IncomingMessage, ServerResponse } from 'http'
import { parse as parseQuery, ParsedUrlQuery } from 'querystring'
import connect, { NextFunction } from 'connect'
import { pathToRegexp, execPathRegexp } from '@ream/common/dist/route-helpers'
import { send } from './send'

export type ReamServerHandler = (
  req: ReamServerRequest,
  res: ReamServerResponse,
  next: NextFunction
) => any

export interface ReamServerRequest extends IncomingMessage {
  url: string
  path: string
  query: ParsedUrlQuery
  params: {
    [k: string]: any
  }
}

export interface ReamServerResponse extends ServerResponse {
  json: (obj: any) => void
  send: (obj: any) => void
}

type ReamServerErrorHandler = (
  err: Error,
  req: ReamServerRequest,
  res: ReamServerResponse
) => void

export class Server {
  app: connect.Server

  constructor() {
    this.app = connect()

    this.app.use(
      // @ts-ignore
      (req: ReamServerRequest, res: ReamServerResponse, next: NextFunction) => {
        Object.defineProperties(req, {
          path: {
            enumerable: true,
            get() {
              return req.url && req.url.split('?')[0]
            },
          },
          query: {
            enumerable: true,
            get() {
              return req.url && parseQuery(req.url.split('?')[1])
            },
          },
        })
        res.json = (obj: any) => {
          send(res, 200, obj)
        }
        res.send = (obj: any) => {
          send(res, 200, obj)
        }
        next()
      }
    )
  }

  use(path: string, ...handlers: ReamServerHandler[]): void

  use(...handlers: ReamServerHandler[]): void

  use(
    pathOrHandler: string | ReamServerHandler,
    ...handlers: ReamServerHandler[]
  ) {
    let path: string | undefined
    let regexp: RegExp | undefined
    const keys: any[] = []

    if (typeof pathOrHandler === 'function') {
      handlers.unshift(pathOrHandler)
    } else if (typeof pathOrHandler === 'string') {
      path = pathOrHandler
      regexp = pathToRegexp(path, keys)
    }

    for (const handler of handlers) {
      this.app.use(async (req: any, res: any, next: NextFunction) => {
        if (regexp && regexp.test(req.path)) {
          const params = execPathRegexp(req.path, regexp, keys)
          req.params = params
          try {
            await handler(req, res, next)
          } catch (err) {
            next(err)
          }
        } else {
          req.params = req.params || {}
          await handler(req, res, next)
        }
      })
    }
  }

  onError(errorHandler: ReamServerErrorHandler) {
    this.app.use((err, req, res, next) => {
      // @ts-ignore
      errorHandler(err, req, res)
    })
  }

  get handler() {
    return this.app
  }
}
