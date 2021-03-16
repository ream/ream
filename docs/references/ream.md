# ream/server

## Types

### `ReamServerHandler`

A type for your API handler function:

```ts
// pages/api/hello.ts
import { ReamServerHandler } from 'ream/server'

const handler: ReamServerHandler = (req, res) => {
  res.send({ hello: true })
}

export default handler
```
