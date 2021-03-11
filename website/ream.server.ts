import { ExtendServer } from '@ream/server'

export const extendServer: ExtendServer = ({ server }) => {
  server.use((req, res, next) => {
    if (req.path === '/haha') return res.send('haha')
    next()
  })
}
