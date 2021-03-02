# Serverless

## Vercel

`api/index.ts`:

```ts
import { createServer } from '@ream/server'
import context from './.ream/meta/server-context'

const { handler } = createServer({ context })

export default handler
```

`vercel.json`:

```json
{
  "rewrites": [{ "source": "/:match*", "destination": "/api/:match*" }]
}
```
