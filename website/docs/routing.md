# Routing

Ream has a file-system based router built on the concept of [pages](#pages).

## Pages

In Ream, a **page** is a Vue Component exported from a `.js` `.ts` or `.vue` file in the pages directory. Each page is associated with a route based on its file name.

**Example**: If you create `pages/about.vue` that exports a Vue component like below, it will be accessible at `/about`.

```vue
<template>
  <div>About</div>
</template>
```

## Dynamic Routing

Defining routes by using predefined paths is not always enough for complex applications. In Ream you can add brackets to a page (`[param]`) to create a dynamic route (a.k.a. url slugs, pretty urls, and others).

Consider the following page `pages/post/[pid].vue`:

```vue
<template>
  <p>Post: {{ $route.params.pid }}</p>
</template>
```

Any route like `/post/1`, `/post/abc`, etc. will be matched by `pages/post/[pid].vue`. The matched value will be sent as a path parameter to the page.

For example, the route `/post/abc` will have the following `params` object:

```json
{ "pid": "abc" }
```

Multiple dynamic route segments work the same way. The page `pages/post/[pid]/[comment].vue` will match the route `/post/abc/a-comment` and its parameters will be:

```json
{ "pid": "abc", "comment": "a-comment" }
```
