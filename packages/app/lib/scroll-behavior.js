export const scrollBehavior = (to, from, savedPosition) => {
  if (to.hash) {
    return {
      el: to.hash,
    }
  }

  if (savedPosition) {
    return savedPosition
  }

  return { top: 0 }
}
