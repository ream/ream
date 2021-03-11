import {
  h,
  createSSRApp,
  isReactive,
  reactive,
  computed,
  Transition,
} from 'vue'
import { createHead, useHead } from '@vueuse/head'
import { RouterView } from 'vue-router'
import { RouterLink, usePreloadResult } from './'
import {
  AppComponent,
  NotFoundComponent,
  ErrorComponent,
} from '/.ream/templates/shared-exports.js'
import { callAsync as callEnhanceAppAsync } from '/.ream/templates/ream.app.js'

export const createApp = async ({ router, initialState }) => {
  const app = createSSRApp({
    setup() {
      useHead({
        meta: [
          { charset: 'utf-8' },
          { name: 'viewport', content: 'width=device-width,initial-scale=1' },
        ],
      })
      return {
        initialState: isReactive(initialState)
          ? initialState
          : reactive(initialState),
      }
    },
    render() {
      const { notFound, error } = usePreloadResult().value

      let Component
      if (notFound) {
        Component = NotFoundComponent
      } else if (error) {
        Component = ErrorComponent
      } else {
        Component = h(RouterView, null, (props) => {
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
            h(props.Component, { key: props.route.path })
          )
        })
      }

      return h(AppComponent, {}, () => [h(Component)])
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
