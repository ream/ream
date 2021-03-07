# App Hooks

You can use app hooks to access `router`, `app` instance etc. App hooks are available in `enhance-app.js` or `enhance-app.ts` in the [source directory](/docs/folder-structure#source-directory).

## `onCreatedApp`

```ts
import { OnCreatedApp } from '@ream/app'

export const onCreatedApp: OnCreatedApp = ({ router, app, initialState }) => {
  // router: Vue Router instance
  // app: Vue app instance
  // initialState: the initial state fetched on server

  // e.g. use router guards
  router.afterEach((to) => {
    console.log('current path', to.path)
  })

  // e.g. Using Vue plugins
  app.use(someVuePlugin)
}
```

## `onCreatedRouter`

```ts
import { OnCreatedRouter } from '@ream/app'

export const onCreatedRouter: OnCreatedRouter = ({ router }) => {
  // Called right after the router is created
  // And before `router.currentRoute` is used
  // So you can manually add routes via `router.addRoute` here
}
```
