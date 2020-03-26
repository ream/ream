---
title: Extending
---

---

## Custom App

The `App` component is used to render a page component, for example this is the default one:

```vue
<script>
export default {
  functional: true,

  props: ['Component', 'pageProps'],

  render(h, { props: { Component, pageProps } }) {
    return h(Component, { props: pageProps })
  }
}
</script>
```

You can replace it by populating a Vue component at `routes/_app.vue`.

## Custom Document

Use `routes/_document.js`.

## Custom Error

[TODO]
