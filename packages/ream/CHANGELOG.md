# ream

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
