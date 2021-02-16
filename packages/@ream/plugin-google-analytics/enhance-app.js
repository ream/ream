/* eslint-disable */
// Google analytics integration for Vue.js renderer
export function onCreatedApp({ router }) {
  if (
    !import.meta.env.SSR &&
    import.meta.env.PROD &&
    import.meta.env.GA_TRACKING_ID
  ) {
    function doNotTrackEnabled() {
      const dntNumber = parseInt(
        navigator.msDoNotTrack || // Internet Explorer 9 and 10 vendor prefix
        window.doNotTrack || // IE 11 uses window.doNotTrack
          navigator.doNotTrack, // W3C
        10
      )

      return dntNumber === 1
    }

    if (doNotTrackEnabled()) {
      // Respect doNotTrack setting
      return
    }

    // prettier-ignore
    ;(function(i, s, o, g, r, a, m) {
      i.GoogleAnalyticsObject = r
      i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
      }
      i[r].l = Number(new Date())
      a = s.createElement(o)
      m = s.getElementsByTagName(o)[0]
      a.async = 1
      a.src = g
      m.parentNode.insertBefore(a, m)
    })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga')

    ga('create', import.meta.env.GA_TRACKING_ID, 'auto')

    if (import.meta.env.GA_ANONYMIZE_IP) {
      ga('set', 'anonymizeIp', true)
    }

    router.afterEach((to) => {
      ga('set', 'page', to.fullPath)
      ga('send', 'pageview')
    })
  }
}
