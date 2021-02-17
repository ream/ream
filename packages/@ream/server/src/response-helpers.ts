import type { ReamServerResponse } from './server'

const TYPE = 'content-type'
const OSTREAM = 'application/octet-stream'

export type SendData = NodeJS.ReadableStream | object | string | Buffer

export function send(res: ReamServerResponse, data: SendData = '') {
  let type = res.getHeader('content-type')

  if (data && typeof (data as NodeJS.ReadableStream).pipe === 'function') {
    res.setHeader(TYPE, type || OSTREAM)
    return (data as NodeJS.ReadableStream).pipe(res)
  }

  if (data instanceof Buffer) {
    type = type || OSTREAM
  } else if (typeof data === 'object') {
    data = JSON.stringify(data)
    type = type || 'application/json;charset=utf-8'
  } else {
    type = type || 'text/plain'
  }

  res.setHeader('content-length', Buffer.byteLength(data))
  res.setHeader('content-type', type)
  res.end(data)
}

export function status(res: ReamServerResponse, code: number) {
  res.statusCode = code
}
