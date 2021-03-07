import { createStore } from 'vuex'

const sleep = (timeout: number) =>
  new Promise((resolve) => setTimeout(resolve, timeout))

export default () =>
  createStore({
    state: {
      count: 0,
      user: null,
    },
    mutations: {
      inc(state) {
        state.count++
      },
      setUser(state, user) {
        state.user = user
      },
    },
    actions: {
      async getInitialState({ commit }, { to }) {
        await sleep(200)
        if (to.name === 'index') {
          // mock async operation

          commit('inc')
        } else if (to.name === '[user]') {
          commit('setUser', { name: to.params.user })
        }
      },
    },
  })
