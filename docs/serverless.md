# Serverless

## Vercel

`api/index.ts`:

```ts
import { createServer } from '@ream/server'
import { serverContext } from './.ream/meta/server-context'

const handler = createServer({ context: serverContext })

export default handler
```

`vercel.json`:

```json
{
  "rewrites": [{ "source": "/:match*", "destination": "/api/:match*" }]
}
```
