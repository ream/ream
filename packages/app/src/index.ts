import { getCurrentInstance, computed, ComputedRef } from 'vue'
import { useRoute } from 'vue-router'
import type { PreloadResult } from 'ream/server'

export const useInitialState = <
  TInitialState extends object = { [k: string]: any },
  TData = any
>(): ComputedRef<
  TInitialState & { preload: { [pathname: string]: PreloadResult<TData> } }
> => {
  const vm = getCurrentInstance()

  return computed(
    () =>
      vm &&
      // @ts-expect-error
      vm.root.setupState.initialState
  )
}

export const usePreloadResult = <TData = any>(): ComputedRef<
  PreloadResult<TData>
> => {
  const vm = getCurrentInstance()
  const routePath = useRoutePath()

  return computed(() => {
    // @ts-expect-error
    const { preload } = vm.root.setupState.initialState
    if (preload[routePath.value]) {
      return preload[routePath.value]
    }
    if (Object.keys(preload).length === 1 && preload['/404.html']) {
      return preload['/404.html']
    }
    return {}
  })
}

export const useServerError = (): ComputedRef<{
  statusCode: number
  message?: string
}> => {
  const result = usePreloadResult()
  // @ts-expect-error
  return computed(() => result.value.error)
}

export const usePageData = <TData = any>(): ComputedRef<TData> => {
  const preloadResult = usePreloadResult()
  // @ts-expect-error
  return computed(() => preloadResult.value.data || {})
}

/**
 * Get the route path without trailing slash
 */
export const useRoutePath = (): ComputedRef<string> => {
  const route = useRoute()
  return computed(() => {
    const p = route.path === '/' ? '/' : route.path.replace(/\/$/, '')
    return p
  })
}

export * from '@vueuse/head'

export * from './link'

export * from './hooks'

export { ClientOnly, defineClientOnlyComponent } from './components/ClientOnly'

export { createSSRApp } from 'vue'

export { useRoute, useRouter, RouterView } from 'vue-router'

export type { Preload, StaticPreload } from 'ream/server'
