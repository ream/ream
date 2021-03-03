export const onCreatedApp = ({ router }) => {
  router.afterEach((to) => {
    to.meta.transitionName = 'fade'
  })
}
