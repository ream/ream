/**
 * Execute `getInitialProps` in router-level `beforeResolve`
 * @param {import('vue').App} vm vm is the root Vue app instance
 */
export const getBeforeResolve = (vm) =>
  function beforeResolve(to, from, next) {
    if (!to.matched || to.matched.length === 0) {
      return next()
    }
    const matched = to.matched[0].components.default
    const { getInitialProps } = matched
    if (!getInitialProps) {
      return next()
    }
    const fetchProps = (next) => {
      getInitialProps({ params: to.params }).then((res) => {
        pagePropsStore[to.path] = res.props
        if (next) {
          next()
        }
      })
    }
    const pagePropsStore = vm.$root.pagePropsStore
    if (pagePropsStore[to.path]) {
      // Page props already exist, use cache and reinvalidate
      next()
      fetchProps()
    } else {
      fetchProps(next)
    }
  }
