export const onCreatedServer = ({ server }) => {
  server.use((req, res, next) => {
    if (req.path === '/haha') return res.send('haha')
    next()
  })
}
