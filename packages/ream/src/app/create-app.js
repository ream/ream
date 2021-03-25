import { h, createSSRApp, isReactive, reactive, Transition } from 'vue'
import { createHead, useHead } from '@vueuse/head'
import { RouterView } from 'vue-router'
import { RouterLink } from './index'
import {
  AppComponent,
  NotFoundComponent,
  ErrorComponent,
} from 'dot-ream/templates/shared-exports.js'
import { callAsync as callEnhanceAppAsync } from 'dot-ream/templates/enhance-app.js'

export const createApp = async ({ router, initialState }) => {
  const app = createSSRApp({
    setup() {
      useHead({
        meta: [
          { charset: 'utf-8' },
          { name: 'viewport', content: 'width=device-width,initial-scale=1' },
        ],
      })
    },
    computed: {
      initialState() {
        return initialState
      },

      loadResult() {
        const { load } = initialState
        const routePath = this.$route.path
        if (load[routePath]) {
          return load[routePath]
        }
        if (Object.keys(load).length === 1 && load['/404.html']) {
          return load['/404.html']
        }
        return {}
      },
    },
    render() {
      const { notFound, error } = this.loadResult

      if (notFound) {
        return h(NotFoundComponent)
      }

      if (error) {
        return h(ErrorComponent)
      }

      return h(AppComponent, {}, () => {
        return [
          h(RouterView, null, (props) => {
            const { meta } = props.route
            const transition =
              meta.transition === false
                ? { name: undefined }
                : typeof meta.transition === 'string'
                ? { name: meta.transition }
                : meta.transition || {}
            const transitionProps = {
              name: 'page',
              mode: 'out-in',
              ...transition,
              onBeforeEnter() {
                _ream.event.emit('trigger-scroll')
                if (transition.onBeforeEnter) {
                  transition.onBeforeEnter()
                }
              },
            }
            return h(Transition, transitionProps, () =>
              h(props.Component, this.loadResult.props)
            )
          }),
        ]
      })
    },
  })

  const head = createHead()

  app.use(router)
  app.use(head)

  // Override Vue Router's RouterLink component
  // Can't use app.component() cause Vue will complain
  app._context.components[RouterLink.name] = RouterLink

  await callEnhanceAppAsync('extendApp', { app, router, initialState })

  return {
    app,
    router,
  }
}
