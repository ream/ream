# Guide

## Introduction

### What is Ream

Ream is a framework for building server-rendered or statically-generated web apps in Vue 3, it's heavily inspired by Next.js and Svelte Kit:

- **Pages**, `.vue` files inside `routes` folder is a Vue component which will be used as route component.
- **Endpoints**, `.js` or `.ts` files inside `routes` folder becomes a request handler.

### Quick Start

Create a new project in seconds with:

```bash
npx create-ream-app my-app
```

:::warning

**PNPM USERS**: You need to explictly install `@vue/server-renderer` in your project as well:

```bash
cd my-app
pnpm i @vue/server-renderer
```

:::

### Commands

- `ream`: Start a dev server
- `ream build`: Build a hybrid website (partially static)
- `ream export`: Build a static website (fully static, meant for static hosts like GitHub Pages, Netlify, or Vercel)
- `ream start`: Start a production server for the already built website. This is for the website built with `ream build`. For static sites built by `ream export`, you can use packages like [serve](http://npm.im/serve) to preview locally.

## Routing

There're two types of routes in Ream: Pages and API routes.

### Pages

Pages are Vue components located in `routes` folder, they can end with `.vue`, `.jsx` or `.tsx` extensions. For example:

```vue
<!-- routes/index.vue -->
<template>
  <h1>Welcome to Ream!</h1>
</template>
```

This file would be mapped to `/` route.

### Endpoints

API routes are `.js` or `.ts` files located in `routes` folder. For example:

```ts
// routes/hello.ts
import { ReamServerHandler } from 'ream/server'

const handler: ReamServerHandler = (req, res) => {
  res.send({ hello: 'from Ream' })
}

export default handler
```

This file would be mapped to `/hello` route.

## Data Fetching

There're two ways to fetch data in Ream, you can either fetch data on demand, or fetch data ahead at build time.

### Fetching on Demand

A page can export a `load` function that runs before the component is created, this function is always executed on the server-side.

```vue
<script lang="ts">
import { Load } from 'ream/app'
import { defineComponent } form 'vue'

export const load: Load = (options) => {
  return {
    props: {
      message: 'Hello Ream!',
    },
  }
}

export default defineComponent({
  // Loaded props
  props: ['message']
})
</script>
```

#### Load Options

- `host`: The host name of the request URL.
- `path`: The pathname.
- `query`: The parsed URL query.
- `params`: The derived parameters from the filename.
- `headers`: The request headers.

#### Load Result

`load` should return a Promise which returns an object with following properties (all optional), returning `null` or `undefined` is equivalent to `{ notFound: true }`:

- `props`: `object` Page props, must be serializable.
- `notFound`: `true` Render the 404 page.
- `error`: `{status: number, message?: string}` Render the error page, with optional error message to display.
- `redirect`: `string` Redirect to another URL.

### Fetching at Build Time

If you want to statically generate your website into `.html`, `.js` files, i.e. running `ream export` command, the `load` function will be called at build time. Otherwise when you are running `ream build`, the `load` function will not be called at all, since `ream build` is meant for a server-rendered website. However you might still want certain pages in your server-rendered website to be statically generated at build time, that's where the `preload` function comes in, you can tell Ream to alway prerender certain pages by replacing `load` with `preload`:

```vue
<script lang="ts">
export const preload = () => {
  return {
    props: {
      message: 'Hello Ream!',
    },
  }
}
</script>
```

## Recipes

### Head Management

Ream use [vueuse/head](https://github.com/vueuse/head) to manage `<head>` elements, it's bundled with Ream so you don't have to install it:

```ts
import { defineComponent } from 'vue'
import { useHead } from 'ream/app'

export default defineComponent({
  setup() {
    useHead({
      title: 'Home',
    })
  },
})
```

You can also use the `<Head>` component if that's desired:

```vue
<script lang="ts">
import { defineComponent } from 'vue'
import { Head } from 'ream/app'

export default defineComponent({
  components: {
    Head,
  },
})
</script>

<template>
  <Head>
    <title>Hello World</title>
    <html lang="en-US" class="theme-dark" />
  </Head>
</template>
```

Check out the docs of [vueuse/head](https://github.com/vueuse/head) for advanced usages.
