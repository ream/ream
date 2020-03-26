---
title: Programmatic Usage
---

## Starting Server

```js
const { createServer } = require('http')
const { Ream } = require('ream')

const ream = new Ream({
  dev: process.env.NODE_ENV === 'development',
  dir: '.', // optional
  port: 4000 // optional
})

ream.prepare()
.then(() => {
  const handler = ream.getRequestHandler()
  const server = createServer(handler)
  server.listen(ream.port)
  console.log(`Open http://localhost:${ream.port}`)
})
```