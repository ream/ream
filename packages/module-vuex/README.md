# @ream/module-vue

## Install

```bash
npm i @ream/module-vuex vuex
# Or Yarn
yarn add @ream/module-vuex vuex
```

## Usage

Add it to your `ream.config.js`:

```js
export default {
  modules: ['@ream/module-vuex'],
}
```

This module assumes you have created a Vuex store instance in `@/store`, `@` is an alias to your source directory.

```ts
// store.ts or store/index.ts
import { createStore } from 'vuex'

export default () =>
  createStore({
    state: {
      count: 0,
    },
  })
```

If you want to prefetch some data on the server-side, add a `serverInit` action, it will be invoked before server-side rendering:

```ts
createStore({
  state: {
    count: 0,
  },
  actions: {
    async serverInit({ commit }) {
      const count = await getCountFromApi()
      await commit('setCountFromApi', count)
    },
  },
  mutations: {
    setCountFromApi(state, count) {
      state.count = count
    },
  },
})
```

## License

MIT &copy; [EGOIST](https://github.com/sponsors/egoist)
