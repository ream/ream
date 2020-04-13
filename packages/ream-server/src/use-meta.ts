import Vue from 'vue'
import Meta from 'vue-meta'

export function useMeta() {
  Vue.use(Meta, {
    keyName: 'head',
    attribute: 'x-ream-head',
    ssrAttribute: 'x-ream-ssr',
    tagIDKeyName: 'rhid',
    refreshOnceOnNavigation: true,
  })
}