import Vue from 'vue'
import VueMeta from 'vue-meta'
import { createRouter } from './router'

Vue.use(VueMeta, {
  keyName: 'head',
  attribute: 'data-ream-head',
  ssrAttribute: 'data-ream-head-ssr',
  tagIDKeyName: 'rhid',
  refreshOnceOnNavigation: true
})

export function createApp() {
  const router = createRouter()
  const app = new Vue({
    __pageProps: null,
    head: {},
    router,
    render: h => h('div', { attrs: { id: '_ream' } }, [
      h('transition', {
        on: {
          'before-enter'() {
            app.$nextTick(() => {
              app.$emit('trigger-scroll')
            })
          }
        }
      }, [h('router-view')])
    ]),
  })
  return {
    app,
    router,
  }
}

export const App = {
  functional: true,
  
  props: ['Component', 'pageProps'],

  render(h, {props: { Component, pageProps }}) {
    return h(Component, {
      props: pageProps
    })
  }
}