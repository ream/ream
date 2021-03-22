# How Does It Work

## SPA mode

By default Ream apps run in SPA mode, which means it only does what Vite does, you can use any client-side libraries to create your app inside `main.ts`, for example, using React:

```ts
import React from 'react'
import { render } from 'react-dom'
import { App } from './App'

render(<App />, document.getElementById('_ream'))
```

However this is not the major selling point of Ream, as you can just use Vite to achieve the same goal.

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

For example, you can feed `context.routes` to Vue Router or React Router or even implement your own routing.

## SSR mode

Ream allows your app to render HTML on each request on the server-side, as long as your app support server-side rendering.

To do so the default export in `main.ts` needs to return some essential data when the code is running on the server-side:

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

:::warning
By default your code will never run on the server-side, unless you have `ssr` set to `true` in your Ream config file.
:::
