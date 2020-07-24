export default (req, res) => {
  throw new Error('fuck')
  res.end(JSON.stringify([{ title: 'first post' }, { title: 'second psot' }]))
}
