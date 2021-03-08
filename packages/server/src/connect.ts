import { IncomingMessage, ServerResponse } from 'http'
import { parse as parseQuery, ParsedUrlQuery } from 'querystring'

export type Middleware<TReq = any, TRes = any> = (
  req: TReq,
  res: TRes,
  next: NextFunction
) => void | Promise<void>

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

const onError: OnError<any, any> = (err, req, res) => {
  res.statusCode = typeof err === 'string' ? 500 : err.code || err.status || 500
  if (typeof err === 'string') {
    res.end(err)
  } else {
    res.end(err.message)
  }
}

export interface ConnectError extends Error {
  code?: number
  status?: number
}

export type NextFunction = (err?: ConnectError) => void

export type OnError<TReq, TRes> = (
  err: ConnectError | string,
  req: TReq,
  res: TRes,
  next: NextFunction
) => void

export type Options<TReq, TRes> = {
  onError?: OnError<TReq, TRes>
}
export class Connect<
  TReq extends ConnectRequest,
  TRes extends ConnectResponse
> {
  wares: {
    [base: string]: Middleware<TReq, TRes>[]
  }

  onError: OnError<TReq, TRes>

  constructor(options: Options<TReq, TRes>) {
    this.wares = { '': [] }
    this.onError = options.onError || onError
  }

  use(base: string | Middleware<TReq, TRes>, ...fns: Middleware<TReq, TRes>[]) {
    if (typeof base === 'string') {
      this.wares[base] = this.wares[base] || []
      this.wares[base].push(...fns)
    } else if (typeof base === 'function') {
      this.wares[''].push(base, ...fns)
    }
  }

  handler(_req: IncomingMessage, _res: ServerResponse) {
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

    const next = (err?: ConnectError) => {
      err ? this.onError(err, req, res, next) : loop()
    }
    const loop = async () => {
      if (!res.writableEnded && i < size) {
        const fn = wares[i++]
        try {
          await fn(req, res, next)
        } catch (err) {
          next(err)
        }
      }
    }

    loop()
  }
}

export const connect = <
  TReq extends ConnectRequest,
  TRes extends ConnectResponse
>(
  options: Options<TReq, TRes>
) => new Connect(options)
