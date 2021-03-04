import createStore from '@/store'

const STATE_KEY = 'VUEX_STATE'

export const onCreatedApp = async ({ initialState, app }) => {
  const store = createStore()
  app.use(store)
  if (import.meta.env.SSR) {
    if (store._actions.serverInit) {
      await store.dispatch('serverInit')
      initialState[STATE_KEY] = store.state
    }
  } else {
    if (initialState[STATE_KEY]) {
      store.replaceState(initialState[STATE_KEY])
    }
  }
}
