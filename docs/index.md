:::warning
Ream is under heavy development, it's not yet available for public testing.
:::

# What is Ream

Ream is a toolkit for building web apps with **any** framework.

## Features

### Unopinionated

You can fully customize how your app is rendered, all you need is an entry file `main.ts` with a default export:

```ts
// main.ts

export default () => {
  // Get initial HTML on the server-side
  if (import.meta.env.SSR) {
    return { html: `...server-rendered HTML` }
  }

  // Otherwise render the app on the client-side
  // ...
}
```

### File-system based routing

Ream will automatically load the files in the `pages` folder and pass it to your entry file, then you can use the routes to launch your app as you wish. Each file in `pages` folder is mapped to a corresponding client route, for example, given you have `pages/index.tsx` and `pages/user/[user].tsx`, Ream will pass a `routes` array like this to the entry file:

```ts
// main.ts
import { RenderContext } from 'ream/app'

export default (context: RenderContext) => {
  assert.equal(context.routes, [
    { name: 'index', path: '/', load: () => import('./pages/index.ts') },
    {
      name: 'user/[user]',
      path: '/user/:user',
      load: () => import('./pages/user/[user].ts'),
    },
  ])
}
```

Nested routes are also supported, for more details please check out routing.

### API routes

Your front-end applications often need to call back-end APIs, so why not do both in one project? Ream allows you to add api handlers in the `api` folder, kind of like the `routes` folder but for adding routes to the back-end server. For example if you have a `api/hello.ts`:

```ts
export default (req, res) => {
  res.send(`hello world`)
}
```

When you visit `/hello`, the page will display `hello world`.

### Framework support

Ream works with any framework, but it also provides deeper integration with React, Vue and Svelte for better experience.

For example, packages like `@ream/framework-vue` allows you to quickly bootstrap an app with a built-in router, as well as support for route transition, data loading, SSR,

```ts
// main.ts
import { render } from '@ream/framework-vue'

export default render
```
