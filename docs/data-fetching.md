# Data Fetching

## Preload

If you export an async function called `preload` from a page, Ream will render this page on each request using the data returned in the `preload` function.

```vue
<script>
import { usePageData } from '@ream/app'
import { db } from './path/to/db'

export const preload = async (context) => {
  const posts = await db.findPosts({ user: context.params.user })
  return {
    data: {
      posts,
    },
  }
}

export default {
  setup() {
    // Get the data you fetched in `preload` function
    const page = usePageData()

    return {
      page,
    }
  },
}
</script>
```

### How does `preload` work

On the server-side, Ream executes `preload` before rendering the page, on the client-side, Ream will send a request to the server to get the result of `preload`, the function is entirely processed on the server-side. We use a Babel plugin to eliminate `preload` function from the client bundle so the code it depends on as well as itself will never be exposed on the client-side, that's why you can even query a database directly in the `preload` function.

## Static Preload

For pages that rely on external data but don't need to be updated frequently, and you want to render them into static HTML files at build time, you can replace `preload` with `staticPreload`.

For example, let's say you are building a static blog, and you want to fetch blog posts from an external API:

```vue
<!-- pages/posts/[id].vue -->
<script>
export const staticPreload = async (context) => {
  const post = await fetchPostFromApi({ id: context.params.id })
  return {
    data: {
      post,
    },
  }
}

export default {
  setup() {
    const page = usePageData()

    return {
      page,
    }
  },
}
</script>
```

The signature `staticPreload` is almost the same as `preload`, both of them are executed on server-side, but `staticPreload` will tell Ream to pre-render the page at build time.

Notes:

- You can **NOT** use `preload` and `staticPreload` in the same page.
- Pages use neither `preload` nor `staticPreload` will always be rendered at build time.
