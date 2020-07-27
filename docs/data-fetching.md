# Data Fetching

## Preload

Page components can have an optional `preload` function that will load some data that the page depends on:

```vue
<script>
import { fetch } from 'ream/fetch'

export const preload = async (context) => {
  const posts = await fetch(`/blog/posts.json?user=${context.params.user}`)
  return {
    // `props` will be passed to the component as props
    props: {
      posts,
    },
  }
}

export default {
  props: ['posts'],
}
</script>
```

The `context` parameter is an object containing the following keys:

- `params` contains the route parameters for pages using dynamic routes. For example, if the page name is `[id].vue`, then params will look like `{ id: '...' }`. To learn more, take a look at the [Dynamic Routing documentation](/docs/routing#dynamic-routing).

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
    props: {
      posts,
    },
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

## Static Preload

Ream applies incremental static page generation to pages that don't use `preload` or `serverPreload`, meaning that you can dynamically render some pages while pre-rendering the other pages.

In many cases you will still need to use external data on pre-rendered pages, Ream provides `staticPreload` for such use case:

For example, let's say you are building a static blog, and you want to fetch blog posts from an external API:

```vue
<!-- routes/posts/[id].vue -->
<script>
export const staticPreload = async (context) => {
  const post = await fetchPostFromApi({ id: context.params.id })
  return {
    props: {
      post,
    },
  }
}

export default {
  props: ['post'],
}
</script>
```

`staticPreload` is actually very similar to `serverPreload`, both of them are executed on server-side, but `staticPreload` will pre-render the pages:

- For dynamic routes (i.e. `:id`), it's rendered at build time.
- For non-dynamic routes, Ream renders them at request time but will cache the result and susequent requests will use the cache instead.

### Static Paths

For dynamic routes, you can also render them at build time by using the `staticPaths` option, suppose that you have a page that uses dynamic routes named `src/pages/posts/[id].vue`

```vue
<script>
export const staticPreload = async (context) => {
  const post = await fetchPostFromApi({ id: context.params.id })
  return {
    props: {
      post,
    },
  }
}

export const staticPaths = () => {
  return {
    paths: [
      {
        params: {
          /* ... */
        },
      },
    ],
  }
}

export default {
  props: ['post'],
}
</script>
```

The `paths` key returned by `staticPaths` determines which paths will be pre-rendered at build time. For example, if you return following value:

```js
return {
  paths: [{ params: { id: 1 } }, { params: { id: 2 } }],
}
```

Then Ream will statically generate `posts/1` and `posts/2` at build time.

Note that if you want to [export static website](/docs/dynamic-or-static#static-sites), you don't have to use `staticPaths`.
