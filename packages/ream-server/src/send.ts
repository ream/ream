import { ServerResponse } from 'http'
import { Stream } from 'stream'

// based on is-stream https://github.com/sindresorhus/is-stream/blob/c918e3795ea2451b5265f331a00fb6a8aaa27816/license
function isStream(stream: any) {
  return (
    stream !== null &&
    typeof stream === 'object' &&
    typeof stream.pipe === 'function'
  )
}

function readable(stream: any) {
  return (
    isStream(stream) &&
    stream.readable !== false &&
    typeof stream._read === 'function' &&
    typeof stream._readableState === 'object'
  )
}

export function send(res: ServerResponse, code: number, obj: any = null) {
  res.statusCode = code

  if (obj === null) {
    res.end()
    return
  }

  if (Buffer.isBuffer(obj)) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/octet-stream')
    }

    res.setHeader('Content-Length', obj.length)
    res.end(obj)
    return
  }

  if (obj instanceof Stream || readable(obj)) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/octet-stream')
    }

    obj.pipe(res)
    return
  }

  let str = obj

  if (typeof obj === 'object' || typeof obj === 'number') {
    // We stringify before setting the header
    // in case `JSON.stringify` throws and a
    // 500 has to be sent instead

    // the `JSON.stringify` call is split into
    // two cases as `JSON.stringify` is optimized
    // in V8 if called with only one argument
    if (__DEV__) {
      str = JSON.stringify(obj, null, 2)
    } else {
      str = JSON.stringify(obj)
    }

    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
    }
  }

  res.setHeader('Content-Length', Buffer.byteLength(str))
  res.end(str)
}
