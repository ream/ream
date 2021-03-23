# Routing

Ream has a file-system based router which supports both client-side routes and API routes.

## Client Routes

In Ream, client routes are stored in the `pages` directory. Each "page" is associated with a route based on its file name.

**Example**: If you have a page at `pages/about.jsx`, it will be converted to a route as follows:

```js
{
  name: 'about',
  path: '/about',
  load: () => import('./pages/about.jsx')
}
```

Then all the routes will be passed to app entry file, it's all up to you how to use these routes to bootstrap your app.

## Route Parameters

Defining routes by using predefined paths is not always enough for complex applications. In Ream you can add brackets to a page (`[param]`) to allow dynamic parameters (a.k.a. url slugs, like `:param` in Express-like server framework).

Some examples:

- `pages/user/[uid].vue`: Corresponding route path: `/user/:uid`
- `pages/post/[...slug].jsx`: Corresponding route path: `/post/:slug(.+)`

## Nested Client Routes

Some libraries like React Router and Vue Router support nested routes, so Ream's file-system routing system also manages to support this.

To create children pages, put them in a folder with the same name as the parent page, for example:

```
- user/[user].vue
- user/[user]/profile.vue
- user/[user]/posts.vue
- user/[user]/index.vue
```

..is converted to following routes:

```js
;[
  {
    path: '/user/:user',
    load: () => import('./pages/user/[user].vue'),
    children: [
      {
        path: 'profile',
        load: () => import('./pages/user/[user]/profile.vue'),
      },
      {
        path: 'posts',
        load: () => import('./pages/user/[user]/posts.vue'),
      },
      {
        path: '',
        load: () => import('./pages/user/[user]/index.vue'),
      },
    ],
  },
]
```

## API Routes

Each file inside `api` folder will be used as a request handler for matched URLs.

For example: `api/hello.ts`:

```ts
import { ReamServerHandler } from 'ream/server'

const handler: ReamServerHandler = (req, res) => {
  req.send({ hello: 'world' })
}

export default handler
```

Route parameters are also supported in API routes.

:::tip
API routes are registered before app routes, which means `api/index.ts` can override `pages/index.js`.
:::

The request handler receives the following parameters:

- `req`: An instance of `http.IncomingMessage`,
- `res`: An instance of `http.ServerResponse`, plus some helper functions you can see [below](#response-helpers)

## Response Helpers

The response (`res`) includes a set of Express.js-like methods to improve the developer experience and increase the speed of creating new API endpoints, take a look at the following example:

The included helpers are:

- `res.status(code)` - A function to set the status code. code must be a valid HTTP status code
- `res.send(body)` - Sends the HTTP response. `body` can be a `string`, an `object`, a `NodeJS.ReadableStream` or a `Buffer`.
