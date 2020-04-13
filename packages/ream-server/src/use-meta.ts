import Vue from 'vue'
import Meta from 'vue-meta'

export function useMeta() {
  Vue.use(Meta, {
    keyName: 'head',
    attribute: 'data-ream-head',
    ssrAttribute: 'data-ream-ssr',
    tagIDKeyName: 'rhid',
    refreshOnceOnNavigation: true,
  })
}