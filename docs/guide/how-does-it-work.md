# How Does It Work

## Render function

If you export a function in `main.ts`, it will be used as the render function, and some additional data will be passed to it as the only argument:

```ts
// main.ts
import { RenderContext } from 'ream/app'

export default (context: RenderContext) => {
  // Make use of `context`
  // context.routes: Collected routes from pages folder
  // context.url: Current URL
  // context.initialState: Initial app state
}
```

For example, you can feed `context.routes` to Vue Router or React Router or even implement your own routing. Learn more about [routing](/guide/routing).

## Server-side rendering

Ream allows your app to render HTML on each request on the server-side, all you have to do is to make sure the default export in `main.ts` returns some essential data when the code is running on the server-side:

```ts
// main.ts
import { RenderContext } from 'ream/app'

export default (context: RenderContext) => {
  // When the code is running on the server-side:
  if (import.meta.env.SSR) {
    const { serverRender } = await import('./server-render')
    // Returns { html: `...` }
    return serverRender(context)
  }

  const { clientRender } = await import('./client-render')
  clientRender(context)
}
```

Note that you need to implement `serverRender` and `clientRender` yourself, we do have first-class support for [Vue.js](/frameworks/vue) though.

When the code is evaluated on the server-side, `import.meta.env.SSR` will be `true`.
