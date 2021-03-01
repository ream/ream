# Data Fetching

## Preload

If you export an async function called `preload` from a page, Ream will render this page on each request using the data returned in the `preload` function. And then you can use the Vue composable `usePageData` to retrieve the data you just fetched:

```vue
<script lang="ts">
import { usePageData, Preload } from '@ream/app'
import { db } from './path/to/db'

interface PageData {
  user: {
    name: string
  }
}

export const preload: Preload<PageData> = async (context) => {
  const user = await db.findUser({ user: context.params.user })
  return {
    data: {
      user,
    },
  }
}

export default {
  setup() {
    // Get the data you fetched in `preload` function
    const page = usePageData<PageData>()

    return {
      page,
    }
  },
}
</script>

<template>
  <div>{{ page.user.name }}</div>
</template>
```

The return value of `preload` is of four types:

- `{ data: object }`: `data` is an object with the data that will be received by the page component.
- `{ notFound: true }`: Let Ream render the 404 page and set status code to 404.
- `{ redirect: string | { url: string, permanent?: boolean } }`: To allow redirecting to any URL.
- `{ error: { statusCode: number, stack?: string } }`: Let Ream render the error page.

### How does `preload` work

On the server-side, Ream executes `preload` before rendering the page, on the client-side, Ream will send a request to the server to get the result of `preload`, the function is entirely processed on the server-side. We use a Babel plugin to eliminate `preload` function from the client bundle so the code it depends on as well as itself will never be exposed on the client-side, that's why you can even query a database directly in the `preload` function.

## Static Preload

For pages that rely on external data but don't need to be updated frequently, and you want to render them into static HTML files at build time, you can replace `preload` with `staticPreload`.

For example, let's say you are building a static blog, and you want to fetch blog posts from an external API:

```vue
<!-- pages/posts/[id].vue -->
<script lang="ts">
import { StaticPreload, usePageData } from '@ream/app'

export const staticPreload: StaticPreload = async (context) => {
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

### Static Preload with Dynamic Routes

Dynamic routes like `docs/[...slug].vue` doesn't work with `StaticPreload` by default because we don't know the exact values of `slug` at build time, so if you want to prerender those pages at build you need to export a `getStaticPaths` function:

```ts
import { StaticPreload, GetStaticPaths } from '@ream/app'

export const staticPreload: StaticPreload = (ctx) => {
  return {
    data: getDataBySlug(ctx.params.slug),
  }
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [
      { params: { slug: 'getting-started' } },
      { params: { slug: 'installation' } },
    ],
    fallback: false,
  }
}
```

With the above code, Ream will prerender `/docs/getting-started` and `/docs/installation` for you at build time. If you don't plan to export your app as a static site, you can use the `fallback` property to tell Ream whether to render missing paths at request time, for instance `/docs/foo` will result in the 404 page here, but when `fallback` is set to true, Ream will run the `staticPreload` on each request for missing paths and render the actual page instead, in the background Ream will cache the HTML result and JSON result so subsequent requests will use the cache instead.
