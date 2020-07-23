# Data Fetching

Page components can have an optional `preload` function that will load some data that the page depends on:

```vue
<script>
export const preload = async ({ params }) => {
  const posts = await fetch(`/blog/posts.json?user=${params.user}`)
  return {
    // Props will be passed to the component as props
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

- `params` contains the route parameters for pages using dynamic routes. For example, if the page name is `[id].vue`, then params will look like `{ id: '...' }`. To learn more, take a look at the [Dynamic Routing documentation](/docs/routing#dynamic-routing). You should use this together with `getStaticPaths`, which we’ll explain later.

## Caching Pages

```vue
<script>
export const preload = async (context) => {
  const posts = await context.fetch(
    `/blog/posts.json?user=${context.query.user}`
  )
  return {
    cache: true, // <-- this!
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

This page will only be server-rendered on the first request, for subsequent requests Ream will respond with the result of the first request.
