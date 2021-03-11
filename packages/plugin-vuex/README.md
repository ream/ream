# @ream/plugin-vuex

## Install

```bash
npm i @ream/plugin-vuex vuex
# Or Yarn
yarn add @ream/plugin-vuex vuex
```

## Usage

Add it to your `ream.config.js`:

```js
import vuex from '@ream/plugin-vuex'

export default {
  plugins: [vuex()],
}
```

This plugin assumes you have created a Vuex store instance in `@/store`, `@` is an alias to your source directory.

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

If you want to prefetch data during SSR, add a `getInitialState` action, it will be invoked before server-side rendering and each navigation in browser:

```ts
createStore({
  state: {
    post: null,
  },
  actions: {
    async getInitialState({ commit }, { to, from }) {
      if (to.name === 'posts/[slug]') {
        const post = await fetchPost(to.params.slug)
        commit('setPost', post)
      }
    },
  },
  mutations: {
    setPost(state, post) {
      state.post = post
    },
  },
})
```

## License

MIT &copy; [EGOIST](https://github.com/sponsors/egoist)
