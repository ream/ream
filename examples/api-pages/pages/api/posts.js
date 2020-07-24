export default (req, res) => {
  res.end(JSON.stringify([{ title: 'first post' }, { title: 'second psot' }]))
}
