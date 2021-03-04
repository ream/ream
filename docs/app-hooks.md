# App Hooks

You can use app hooks to access `router`, `app` instance etc. App hooks are available in `enhance-app.js` or `enhance-app.ts` in the [source directory](/docs/folder-structure#source-directory).

```ts
export const onCreatedApp = ({ router, app, initialState }) => {
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
