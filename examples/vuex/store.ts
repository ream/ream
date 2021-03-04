import { createStore } from 'vuex'

export default () =>
  createStore({
    state: {
      count: 0,
    },
    mutations: {
      inc(state) {
        state.count++
      },
    },
    actions: {
      async serverInit({ commit }) {
        // mock async operation
        await new Promise((resolve) => setTimeout(resolve, 500))
        commit('inc')
      },
    },
  })
