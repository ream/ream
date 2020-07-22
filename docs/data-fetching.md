# Data Fetching

Page components can have an optional `preload` function that will load some data that the page depends on

```vue
<script>
export const preload = async context => {
  const posts = await context.fetch(
    `/blog/posts.json?user=${context.query.user}`
  )
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

## Caching Props

```vue
<script>
export const preload = async context => {
  const posts = await context.fetch(
    `/blog/posts.json?user=${context.query.user}`
  )
  return {
    cacheProps: 86400 // seconds -> 1 day
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

`preload` function won't be execute until the next day.

## Caching Document

You can also cache the entire HTML document, so Ream will simply return cache HTML string instead of doing another round of server-side rendering.

```vue
<script>
export const preload = async context => {
  const posts = await context.fetch(
    `/blog/posts.json?user=${context.query.user}`
  )
  return {
    cacheDocument: 86400 // seconds -> 1 day
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
