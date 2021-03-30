import { defineComponent, h, Transition } from 'vue'
import { RouterView as OG_RouterView } from 'vue-router'
import { useLoadResult } from '..'

const getProps = (props: Record<string, any>, keys: string[]) => {
  return keys.reduce((res, key) => {
    return { ...res, [key]: props[key] }
  }, {})
}

export const ReamPage = defineComponent({
  name: 'ReamPage',

  inheritAttrs: false,

  setup() {
    return () => {
      const loadResult = useLoadResult()
      return h(OG_RouterView, null, {
        default: (props: any) => {
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
          return h(Transition, transitionProps, () => {
            const componentProps = props.Component.type.props
            return h(props.Component, {
              ...getProps(
                loadResult.props || {},
                Array.isArray(componentProps)
                  ? componentProps
                  : componentProps
                  ? Object.keys(componentProps)
                  : []
              ),
            })
          })
        },
      })
    }
  },
})
