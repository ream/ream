# Data Fetching

## Preload

If you export an async function called `preload` from a page, Ream will pre-render this page on each request using the data returned by `preload`.

```vue
<script>
import { db } from './path/to/db'

export const preload = async (context) => {
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

As you can see, you can use server-side utilities as if you're writing a Node.js server in the `preload` function, these code will never be exposed on the client-side.

### How does `preload` work

On the server-side, Ream executes `preload` before rendering the page, on the client-side, Ream will send a request to the server to get the result of `preload`, the function is entirely processed on the server-side. We also automatically eliminate this function and whatever this function depends on from the client bundle.

## Static Preload

In many cases you will still need to use external data on pre-rendered pages, `preload` kills the possiblity of pre-rendering web pages at build time, so Ream provides `staticPreload` for such use case:

For example, let's say you are building a static blog, and you want to fetch blog posts from an external API:

```vue
<!-- pages/posts/[id].vue -->
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

The signature `staticPreload` is almost the same as `preload`, both of them are executed on server-side, but `staticPreload` will tell Ream to pre-render the page at build time:

- For dynamic path (i.e. containing `[id]` in file name), Ream renders them at request time but will cache the result, and subsequent requests will use the cache instead.
- For static path, it's rendered at build time.

### Static Paths

For dynamic path which use the `staticPreload` function, you can still render them at build time by using the `staticPaths` option, suppose that you have a page that uses dynamic path named `src/pages/posts/[id].vue`

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
