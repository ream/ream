# App Hooks

App hooks are used to extend the functionality of the Vue app, they are available in `ream.app.js` and `ream.app.ts` in the root directory.

## `extendRouter`

- Arguments:
  - `context`: `object`
    - `router`: Vue router instance.
- Returns:
  - `void` `Promise<void>`

This is called right after Ream creates the Vue Router instance using `VueRouter.createRouter`, you can add additional routes using `router.addRoute` in this hook.

## `extendApp`

- Arguments:
  - `context`: `object`
    - `router`: Vue router instance
    - `app`: Vue app instance
    - `initialState`: Initial state, this will be inlined into HTML and gets rehydrated on the client-side.
- Returns:
  - `void` `Promise<void>`

```ts
import { ExtendApp } from '@ream/app'

export const extendApp: ExtendApp = ({ router, app, initialState }) => {
  // e.g. use router guards
  router.afterEach((to) => {
    console.log('current path', to.path)
  })

  // e.g. Using Vue plugins
  app.use(someVuePlugin)
}
```
