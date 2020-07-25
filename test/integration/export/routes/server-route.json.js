export default (req, res) => {
  res.end(
    JSON.stringify({
      message: 'hello world',
    })
  )
}
