# Data Fetching

In a page, there are two ways to pre-fetch data:

- `getStaticProps`
- `getServerSideProps`

## `getStaticProps`

If you export a function (or async function) called `getStaticProps` from a page, Ream will execute the function at build time and store the returned props in a JSON file. In runtime your app will never call this function and instead it will load the JSON file.

```vue
<script>
export const getStaticProps = async (context) => {
  const posts = await getPostsFromAnywhere()
  return {
    // Props will be passed to the component as props
    props: {
      posts
    }
  }
}

export default {
  props: ['posts']
}
</script>
```

The `context` parameter is an object containing the following keys:

- `params` contains the route parameters for pages using dynamic routes. For example, if the page name is `[id].vue`, then params will look like `{ id: '...' }`. To learn more, take a look at the [Dynamic Routing documentation](/docs/routing#dynamic-routing). You should use this together with `getStaticPaths`, which we’ll explain later. 

### `getStaticPaths`

If a page has dynamic routes ([documentation](/routing#dynamic-routing)) and uses `getStaticProps` it needs to define a list of paths that we can use to get actual path at build time. 

If you export a function called `getStaticPaths` from a page that uses dynamic routes, Ream will statically pre-render all the paths specified by `getStaticPaths`.

```vue
<script>
export const getStaticPaths = async () => {
  return {
    paths: [
      { params: {} },
      { params: {} }
    ]
  }
}
</script>
```

## `getServerSideProps`

If you export a function called `getServerSideProps` from a page, Ream will pre-render this page on each request using the props returned by `getServerSideProps`.

```vue
<script>
export const getServerSideProps = async (context) => {
  const posts = await getPostsFromAnywhere()
  return {
    props: {
      posts
    }
  }
}

export default {
  props: ['posts']
}
</script>
```

The `context` parameter is an object containing the following keys:

- `params`: If this page uses a dynamic route, `params` contains the route parameters. If the page name is `[id].vue` , then params will look like `{ id: '' }`. To learn more, take a look at the [Dynamic Routing documentation](/docs/routing#dynamic-routing)
- `req`: HTTP IncomingMessage object.
- `res`: HTTP Response object.
- `query`: The URL `query` object.
