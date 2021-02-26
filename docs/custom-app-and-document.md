# Custom App and Document

## Custom App Component

Populate a `_app.vue` component in the pages folder to use a custom App component:

```vue
<template>
  <slot />
</template>
```

Each page component will be available as the default `<slot>`.

## Custom HTML Document

Populate a `_document.js` or `_document.ts` in the pages folder to control how your app's entire HTML is generated on the server-side:

```ts
import { GetDocument } from '@ream/app'

const getDocument: GetDocument = ({
  head,
  main,
  scripts,
  htmlAttrs,
  bodyAttrs,
}) => {
  return `
  <html${htmlAttrs()}>
    <head>
      ${head()}
    </head>
    <body${bodyAttrs()}>
      ${main()}
      ${scripts()}
    </body>
  </html>
  `
}

export default getDocument
```
