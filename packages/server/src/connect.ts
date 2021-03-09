import { IncomingMessage, ServerResponse } from 'http'
import { parse as parseQuery, ParsedUrlQuery } from 'querystring'

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

export interface ConnectRequest extends IncomingMessage {
  originalUrl: string
  path: string
  query: ParsedUrlQuery
}

export interface ConnectResponse extends ServerResponse {}

const getBaseFromPath = (path: string) => {
  const index = path.indexOf('/')
  return index > 1 ? path.substring(0, index) : path
}

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

export interface ConnectError extends Error {
  code?: number
  status?: number
}

export type NextFunction = (err?: ConnectError) => void

export type Options<TReq, TRes> = {
  onError?: OnError<TReq, TRes>
}

export class Connect<
  TReq extends ConnectRequest,
  TRes extends ConnectResponse
> {
  wares: {
    [base: string]: HandleFunction<TReq, TRes>[]
  }
  options: Options<TReq, TRes>

  constructor(options: Options<TReq, TRes> = {}) {
    this.wares = { '': [] }
    this.options = options
  }

  onError(fn: OnError<TReq, TRes>) {
    this.options.onError = fn
  }

  use(fn: NextHandleFunction<TReq, TRes>): void
  use(fn: HandleFunction<TReq, TRes>): void

  use(base: string, fn: NextHandleFunction<TReq, TRes>): void
  use(base: string, fn: HandleFunction<TReq, TRes>): void

  use(
    base: string | NextHandleFunction<TReq, TRes> | HandleFunction<TReq, TRes>,
    fn?: NextHandleFunction<TReq, TRes> | HandleFunction<TReq, TRes>
  ) {
    if (typeof base === 'string' && fn) {
      this.wares[base] = this.wares[base] || []
      this.wares[base].push(fn)
    } else if (typeof base === 'function') {
      this.wares[''].push(base)
    }
  }

  handler(_req: IncomingMessage, _res: ServerResponse, done?: () => void) {
    const req = _req as TReq
    const res = _res as TRes
    const info = parseUrl(req.url!)
    const wares = [...(this.wares[''] || [])]

    req.originalUrl = req.originalUrl || req.url!
    req.path = info.path as string
    req.query = parseQuery(info.search.substring(1))

    const base = getBaseFromPath(req.path)
    if (this.wares[base]) {
      wares.push(...this.wares[base])
    }

    let i = 0
    const size = wares.length

    const { onError } = this.options

    const next = async (error?: ConnectError) => {
      if (error) {
        return onError && onError(error, req, res)
      }

      // Run `done` when `next` is called in the last middleware
      if (done && i === size) {
        return done()
      }

      if (!res.writableEnded && i < size) {
        try {
          const fn = wares[i++]
          await fn(req, res, next)
        } catch (error) {
          next(error)
        }
      }
    }

    next()
  }
}

export const connect = <
  TReq extends ConnectRequest,
  TRes extends ConnectResponse
>() => new Connect<TReq, TRes>()
