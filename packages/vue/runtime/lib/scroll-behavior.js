export const scrollBehavior = (to, from, savedPosition) => {
  return new Promise((resolve) => {
    const handleScroll = () => {
      _ream.event.off('trigger-scroll', handleScroll)

      if (to.hash) {
        return resolve({
          el: to.hash,
        })
      }

      if (savedPosition) {
        return resolve(savedPosition)
      }

      resolve({
        top: 0,
      })
    }
    _ream.event.on('trigger-scroll', handleScroll)
  })
}
