import 'dot-ream/templates/global-imports'
import { createWebHistory } from 'vue-router'
import { createApp } from './create-app'

const state = window.INITIAL_STATE

const { router, app } = createApp(
  {
    pagePropsStore: state.pagePropsStore,
  },
  createWebHistory()
)

router.isReady().then(() => {
  const vm = app.mount('#_ream')

  if (__DEV__) {
    window.vm = vm
  }

  router.beforeResolve((to, from, next) => {
    if (!to.matched || to.matched.length === 0) {
      return next()
    }
    const matched = to.matched[0].components.default
    const { preload } = matched
    if (!preload) {
      return next()
    }
    const fetchProps = (next) => {
      preload({}).then((res) => {
        pagePropsStore[to.path] = res.props
        next && next()
      })
    }
    const pagePropsStore = vm.pagePropsStore
    if (pagePropsStore[to.path]) {
      next()
      fetchProps()
    } else {
      fetchProps(next)
    }
  })
})
