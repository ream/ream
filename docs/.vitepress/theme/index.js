import './style.css'
import DefaultTheme from 'vitepress/theme'

export default {
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp && DefaultTheme.enhanceApp(ctx)

    if (!import.meta.env.SSR && import.meta.env.PROD) {
      const el = document.createElement('script')
      el.defer = true
      el.async = true
      el.src = `https://static.cloudflareinsights.com/beacon.min.js`
      el.setAttribute(
        'data-cf-beacon',
        `{"token": "9d769b3aa3e14c0888f27dc58cc075c7"}`
      )
      document.body.append(el)
    }
  },
}
