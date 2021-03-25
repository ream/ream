import { getCurrentInstance, computed, ComputedRef } from 'vue'
import { useRoute } from 'vue-router'
import type { LoadResult } from '../node/server'

export const useInitialState = <
  TInitialState extends object = { [k: string]: any },
  TData = any
>(): ComputedRef<
  TInitialState & { load: { [pathname: string]: LoadResult<TData> } }
> => {
  const vm = getCurrentInstance()
  // @ts-expect-error
  return vm.root.ctx.initialState
}

export const useLoadResult = <TProps = any>(): LoadResult<TProps> => {
  const vm = getCurrentInstance()
  // @ts-expect-error
  return vm.root.ctx.loadResult
}

export const useServerError = ():
  | {
      status: number
      message?: string
    }
  | undefined => {
  const result = useLoadResult()
  // @ts-expect-error
  return result.error
}

export const usePageProps = <TData = any>(): ComputedRef<TData> => {
  const result = useLoadResult()
  // @ts-expect-error
  return result.value.props || {}
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

export { AppComponent } from './components/App'
export { ErrorComponent } from './components/Error'
export { NotFoundComponent } from './components/NotFound'

export * from '@vueuse/head'

export * from './link'

export * from './hooks'

export { ClientOnly, defineClientComponent } from './components/ClientOnly'

export { createSSRApp } from 'vue'

export { useRoute, useRouter, RouterView } from 'vue-router'

export type { Preload, Load, GetStaticPaths } from '../node/server'
