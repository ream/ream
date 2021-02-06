# Routing

Ream has a file-system based router which supports Vue-powered pages and server routes.

## Pages

In Ream, pages are Vue Components exported from `.js`, `.ts` or `.vue` files in the `pages` directory. Each page is associated with a route based on its file name.

**Example**: If you create `pages/about.vue` that exports a Vue component like below, it will be accessible at `/about`.

```vue
<template>
  <div>About</div>
</template>
```

## Dynamic Routing

Defining routes by using predefined paths is not always enough for complex applications. In Ream you can add brackets to a page (`[param]`) to allow dynamic path parameters (a.k.a. url slugs, like `:param` in Express-like server framework).

Consider the following page `pages/post/[pid].vue`:

```vue
<template>
  <p>Post: {{ $route.params.pid }}</p>
</template>
```

Any page like `/post/1`, `/post/abc`, etc. will be matched by `pages/post/[pid].vue`. The matched value will be sent as a route parameter to the page.

For example, the page `/post/abc` will have the following `params` object:

```json
{ "pid": "abc" }
```

Multiple dynamic route segments work the same way. The page `pages/post/[pid]/[comment].vue` will match the route `/post/abc/a-comment` and its parameters will be:

```json
{ "pid": "abc", "comment": "a-comment" }
```

### Catch all Routes

Path parameter can be extended to catch all paths by adding three dots (`...`) inside the brackets. For example:

- `pages/post/[...slug].vue` matches `/post/a`, but also `/post/a/b`, `/post/a/b/c` and so on.

Matched parameters will be sent as a route parameter (`slug` in the example) to the page, and it will always be a string, so, the path `/post/a/b/c` will have the following `params` object:

```json
{ "slug": "a/b/c" }
```
