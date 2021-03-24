import { IncomingMessage, ServerResponse } from 'http'
import { parse as parseQuery, ParsedUrlQuery } from 'querystring'
import { Router, HTTPMethod } from '@egoist/router'

export type SimpleHandleFunction<TReq = any, TRes = any> = (
  req: TReq,
  res: TRes
) => void | Promise<void>

export type NextHandleFunction<TReq = any, TRes = any> = (
  req: TReq,
  res: TRes,
  next: NextFunction
) => void | Promise<void>

export type HandleFunction<TReq = any, TRes = any> =
  | SimpleHandleFunction<TReq, TRes>
  | NextHandleFunction<TReq, TRes>

export type NextFunction = (err?: ConnectError) => void

export interface ConnectRequest extends IncomingMessage {
  originalUrl: string
  path: string
  query: ParsedUrlQuery
  params: Record<string, string>
}

export interface ConnectResponse extends ServerResponse {}

const parseUrl = (url: string) => {
  const queryIndex = url.indexOf('?')
  if (queryIndex === -1) {
    return { path: url, search: '' }
  }
  const path = url.substring(0, queryIndex)
  const search = url.substring(queryIndex)
  return { path, search }
}

export type OnError<TReq, TRes> = (
  error: ConnectError | string,
  req: TReq,
  res: TRes
) => void

export class ConnectError extends Error {
  code?: number
  status?: number
}

export type Options<TReq, TRes> = {
  onError?: OnError<TReq, TRes>
  onNoMatch?: SimpleHandleFunction<TReq, TRes>
}

const onError = (
  error: ConnectError | string,
  _: ConnectRequest,
  res: ConnectResponse
) => {
  const status = typeof error === 'string' ? 500 : error.status || 500
  res.statusCode = status
  res.end(status)
}

const notFoundError = new ConnectError('404 not found')
notFoundError.status = 404
export class Connect<
  TReq extends ConnectRequest,
  TRes extends ConnectResponse
> {
  onError: OnError<TReq, TRes>
  onNoMatch: SimpleHandleFunction<TReq, TRes>
  router: Router<HandleFunction<TReq, TRes>>

  constructor(options: Options<TReq, TRes> = {}) {
    this.router = new Router()
    this.onError = options.onError || onError
    this.onNoMatch = options.onNoMatch || this.onError.bind(null, notFoundError)
  }

  add(
    method: HTTPMethod,
    route: string,
    handler: HandleFunction<TReq, TRes>,
    ...handlers: HandleFunction<TReq, TRes>[]
  ): this

  add(
    method: HTTPMethod,
    route: string,
    ...handlers: HandleFunction<TReq, TRes>[]
  ) {
    this.router.add(method, route, ...handlers)

    return this
  }

  use(
    route: string,
    handler: HandleFunction<TReq, TRes>,
    ...handlers: HandleFunction<TReq, TRes>[]
  ): this
  use(
    handler: HandleFunction<TReq, TRes>,
    ...handlers: HandleFunction<TReq, TRes>[]
  ): this

  use(
    route: string | HandleFunction<TReq, TRes>,
    ...handlers: HandleFunction<TReq, TRes>[]
  ) {
    if (typeof route === 'string') {
      this.router.use(route, ...handlers)
    } else if (typeof route === 'function') {
      this.router.use('*', route, ...handlers)
    }

    return this
  }

  get = this.add.bind(this, 'GET')
  head = this.add.bind(this, 'HEAD')
  patch = this.add.bind(this, 'PATCH')
  options = this.add.bind(this, 'OPTIONS')
  connect = this.add.bind(this, 'CONNECT')
  delete = this.add.bind(this, 'DELETE')
  trace = this.add.bind(this, 'TRACE')
  post = this.add.bind(this, 'POST')
  put = this.add.bind(this, 'PUT')

  handler = (_req: IncomingMessage, _res: ServerResponse) => {
    const req = _req as TReq
    const res = _res as TRes
    const info = parseUrl(req.url!)

    req.originalUrl = req.originalUrl || req.url!
    req.path = info.path as string
    req.query = parseQuery(info.search.substring(1))

    const obj = this.router.find(req.method as HTTPMethod, req.url!)
    req.params = obj.params
    obj.handlers.push(this.onNoMatch)

    let i = 0

    const next = (error?: string | ConnectError) => {
      if (error) return this.onError(error, req, res)

      const handle = obj.handlers[i++]
      if (handle) {
        handle(req, res, next)
      }
    }

    next()
  }
}

export const connect = <
  TReq extends ConnectRequest,
  TRes extends ConnectResponse
>(
  options?: Options<TReq, TRes>
) => new Connect<TReq, TRes>(options)
