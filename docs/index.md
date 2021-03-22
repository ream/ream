:::warning
Ream is under heavy development, it's not yet available for public testing.
:::

# What is Ream

Ream is a toolkit for building web apps with **any** framework.

## Core features

### Single-page app

You can use Ream to build single-page applications, think of it as webpack or Vite without configuration, Ream specifies your application entry file as `main.js` or `main.ts` (or even jsx and tsx) and you can then write your application code in it.

### File-system based routing

Ream will automatically load the files in the `pages` folder and pass it to your entry file, then you can use the routes to launch your app as you wish. Each file in `pages` folder is mapped to a corresponding client route, for example, given you have `pages/index.tsx` and `pages/user/[user].tsx`, Ream will pass a `routes` array like this to the entry file:

```ts
// main.ts
import { render } from '@ream/framework-vue'

export default render
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

## Plugin features

### Framework support

Ream works with any framework, but it also provides deeper integration with React, Vue and Svelte for better experience.

For example, packages like `@ream/vue` allows you to quickly bootstrap a Vue Router powered app:

```ts
import { createApp } from '@ream/vue'

export default ({ routes }) => {
  const app = createApp({
    routes,
  })

  return app
}
```

It provides not only a built-in router, but also support for route transition, data loading, etc.

### Server-side rendering

Ream has fine-grained support for server-side rendering, you can enable SSR for your entire app or just a selection of pages.
