# Special Pages

## Custom App Component

Populate a `_app.vue` in the pages folder to use a custom App component:

```vue
<template>
  <slot />
</template>
```

Each page component will be available as the default `<slot>`.

## Custom Error Page

Populate a `_error.vue` in the pages folder to use a custom error page:

```vue
<script>
import { useServerError } from '@ream/app'

export default {
  setup() {
    return {
      error: useServerError(),
    }
  },
}
</script>

<template>
  <h1>Error: {{ error.statusCode }}</h1>
  <div v-if="error.message">{{ error.message }}</div>
</template>
```

## Custom 404 Page

Populate a `404.vue` in the pages folder to use a custom 404 page:

```vue
<template>
  <h1>404 not found</h1>
</template>
```

We separate 404 errors from `_error.vue` because we need to statically generate a `404.html` at build time.
