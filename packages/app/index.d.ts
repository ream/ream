import { ComputedRef, ComponentPublicInstance } from 'vue'
import { Router } from 'vue-router'
import { PreloadResult } from './server-types'

export const useInitialState: <
  TInitialState extends object = { [k: string]: any },
  TData = any
>() => ComputedRef<
  TInitialState & { preload: { [pathname: string]: PreloadResult<TData> } }
>

export const usePreloadResult: <TData = any>() => ComputedRef<
  PreloadResult<TData>
>

export const usePageData: <TData = any>() => ComputedRef<TData>

export const useServerError: () => ComputedRef<{
  statusCode: number
  message?: string
}>

export { useHead } from '@vueuse/head'

export { useRoute, useRouter, RouterView as ReamView } from 'vue-router'

export * from './server-types'

export * from './link'

export const useRoutePath: () => ComputedRef<string>

export { ClientOnly, defineClientOnlyComponent } from './components/ClientOnly'

export type ExtendApp = (context: {
  router: Router
  app: ComponentPublicInstance
  initialState: any
}) => void | Promise<void>

export type ExtendRouter = (context: { router: Router }) => void | Promise<void>
