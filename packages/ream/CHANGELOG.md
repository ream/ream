# ream

## 5.0.0-beta.11

This release only contains bug fixes:

- make sure that `.ream/client` exists before starting the server in production mode
- make hmr work on repl.it
- properly render error and 404 page for `.load.json` requests

## 5.0.0-beta.10

- Catch router error so it won't crash the Node.js process.
- Use `routes` folder instead of `pages` folder for routes.
- Now API routes are renamed to endpoints, inspired by Svelte Kit, they are also available at the root of `routes` folder now, all `.js` and `.ts` files inside `routes` folder are treated as endpoints.
- Refactored the options of `load` function, now it does not expose native Node.js `request` and `response` object.
- FIx standalone build. i.e. the `ream build --standalone` flag, primarily for Vercel.

## 5.0.0-beta.9

- Merge `@ream/app` and `@ream/server` into `ream`, now as `ream/app` and `ream/server`.
- New data fetching functions: `load` and `preload`, replacing previous `preload` and `staticPreload` respectively. Now they return `{ props }` instead of `{ data }`.

## 5.0.0-beta.7

- Add router to the server, powered by [egoist/router](https://github.com/egoist/router)
- **@ream/app**: Bundle dependencies.

## 5.0.0-beta.6

- Better `.env` file support
- Added [`routes` option](https://ream.dev/docs/configuration#routes) in `ream.config.js`, you can now add routes at build time.
- `enhance-app.js` is renamed to `ream.app.js`
  - `onCreatedApp` is renamed to `extendApp`
  - `onCreatedRouter` is renamed to `extendRouter`
- A new file `ream.server.js` for server hooks, available hooks for now: `extendServer`, `getInitialHTML`
- `_document.js` support is removed in favor of `getInitialHTML` hook in `ream.server.js`
- _Experimental_. Re-enabled plugin API, this is experimental so there're no docs for now, but you can check out existing plugins for references.
- _Experimental_. `staticPreload` supports _revalidate_ now.
  ```js
  export const staticPreload = () => {
    return {
      data: {
        foo: true,
      },
      // Cache the result for 5 seconds only
      // Always use the cache, re-generate in the background
      revalidate: 5,
    }
  }
  ```

## 5.0.0-beta.5

- Introduce "modules", modules are a way to extend your app's functionality, for example `@ream/module-vuex` adds Vuex support. Modules are runtime dependencies, so you need to add them to "dependencies" instead of "devDependencies" unless you're building a static site.
- Allow to modify the "initialState" in `onCreatedApp` hook, this variable is used to store data on the server-side and it will be inlined in the initial HTML. For example `@ream/module-vuex` stores Vuex's state as `initialState.VUEX_STATE` on the server-side, and rehydrate Vuex on client-side with the same state.
- Support page transition, just export `transition` in a page component. [#210](https://github.com/ream/ream/pull/210)
- Export `defineClientOnlyComponent` in `@ream/app`. See [docs](https://ream.dev/docs/references/app#defineclientonlycomponent).
- Support esm modules in `ream.config.js`.

## 5.0.0-beta.4

- Add `--standalone` flag to `ream build`
- Use user-provided server host in dev server

## 5.0.0-beta.3

- Do not export pages when the statusCode is 404
- Make server host default to `localhost` instead of `0.0.0.0`

## 5.0.0-beta.2

- Basic serverless support
- Extract CSS from lazy-loaded components in development mode
- Support `redirect` in `preload`
- Support project-level `enhance-app.js`

## 5.0.0-beta.1

### Features

- Inline critical CSS during dev
- Improving CLI logs for `ream export`

### Bug Fixes

- Make it work on Windows ([#204](https://github.com/ream/ream/pull/204))

---

- Updated dependencies [95f8ac9]
  - @ream/app@5.0.0-beta.1
  - @ream/server@5.0.0-beta.1

## 5.0.0-beta.0

### Patch Changes

- 2e14fcb: publish first beta version
- Updated dependencies [2e14fcb]
  - @ream/app@5.0.0-beta.0
  - @ream/server@5.0.0-beta.0

## 5.0.0-alpha.5

### Patch Changes

- bug fixes
