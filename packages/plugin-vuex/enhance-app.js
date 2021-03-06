import { sync } from 'vuex-router-sync'
import createStore from '@/store'

const STATE_KEY = 'VUEX_STATE'

export const extendApp = async ({ initialState, app, router }) => {
  const store = createStore()
  app.use(store)

  sync(store, router)

  const { getInitialState } = store._actions

  if (import.meta.env.SSR) {
    if (getInitialState) {
      await store.dispatch('getInitialState', { to: router.currentRoute.value })
      initialState[STATE_KEY] = store.state
    }
  } else {
    if (initialState[STATE_KEY]) {
      store.replaceState(initialState[STATE_KEY])
    }

    if (getInitialState) {
      // Don't call beforeResolve for initial render
      await router.isReady()

      router.beforeResolve(async (to, from, next) => {
        await store.dispatch('getInitialState', { to, from })
        next()
      })
    }
  }
}
