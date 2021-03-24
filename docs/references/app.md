# @ream/app

## `useHead`

Document `<head>` management, check out the usage at [vueuse/head](https://github.com/vueuse/head#usage).

## `defineClientOnlyComponent`

Create a component that will only get rendered on the client-side:

```ts
import { defineClientOnlyComponent } from '@ream/app'

const MyEditor = defineClientOnlyComponent(
  () => import('../components/MyEditor.vue')
)
```

You can use this API to disable SSR for specific components or pages.

## `usePageData`

Get the page data you fetched in `preload` or `staticPreload`

```ts
const page = usePageData()

// `page` is computed ref
// When using outside Vue templates
// You need the access `page.value` to get the value
```

## Vue Router Re-exports

- `useRouter`
- `useRoute`
- `RouterView`
- `RouterLink`

## `useRoutePath`

Like `useRoute().path` but without trailing slash.

## Types

### `Preload`

A type for the `preload` function:

```ts
import { Preload } from '@ream/app'

export const preload: Preload<{ title: string }> = () => {
  return {
    data: {
      title: 'this should be a string',
    },
  }
}
```

### `StaticPreload`

Like `Preload` but for the `staticPreload` function.
