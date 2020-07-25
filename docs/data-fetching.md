# Data Fetching

## Preload

Page components can have an optional `preload` function that will load some data that the page depends on:

```vue
<script>
import { fetch } from 'ream/fetch'

export const preload = async (context) => {
  const posts = await fetch(`/blog/posts.json?user=${context.params.user}`)
  return {
    // Returned value will be passed to the component as props
    posts,
  }
}

export default {
  props: ['posts'],
}
</script>
```

The `context` parameter is an object containing the following keys:

- `params` contains the route parameters for pages using dynamic routes. For example, if the page name is `[id].vue`, then params will look like `{ id: '...' }`. To learn more, take a look at the [Dynamic Routing documentation](/docs/routing#dynamic-routing). You should use this together with `getStaticPaths`, which we’ll explain later.

### How does `preload` work

The `preload` function is similar to `getInitialProps` in Next.js and `asyncData` in Nuxt.js, it's executed on both server-side and client-side before rendering a page.

## Server Preload

`preload` function is also executed in browser which means you can't just query a database there, you'll have to write browser-compatible code and use browser-compatble libraries.

Luckily you can use `serverPreload` to get rid of that, you can query a database like this:

```vue
<script>
import { db } from './path/to/db'

export const serverPreload = async (context) => {
  const posts = await db.findPosts({ user: context.params.user })
  return {
    // Returned value will be passed to the component as props
    posts,
  }
}

export default {
  props: ['posts'],
}
</script>
```

You can write anything as if you're writing a Node.js server in the `serverPreload` function, these code will never be exposed on the client-side.

### How does `serverPreload` work

On the server-side, it behaves the same as `preload`, on the client-side, instead of executing this function, we send a request to the server to get the result of `serverPreload`, the function is entirely processed on the server-side. We also automatically eliminate this function and whatever this function depends on from the client bundle.
