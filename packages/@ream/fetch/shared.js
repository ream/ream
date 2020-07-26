class FetchError extends Error {
  constructor(message, response) {
    super(message)
    this.name = this.constructor.name
    this.respose = response
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = new Error(message).stack
    }
  }
}

exports.FetchError = FetchError

exports.handleError = function (res) {
  if (!res.ok) {
    throw new FetchError(res.statusText, res)
  }
  return res
}
