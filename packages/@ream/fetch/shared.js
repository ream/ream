exports.handleError = function (res) {
  if (!res.ok) {
    throw res
  }
  return res
}
