import { ComputedRef } from 'vue'
import { PreloadResult } from './server-types'

export const usePageData: <TData = any>() => TData

export const usePreloadResult: <TData = any>() => PreloadResult<TData>

export { useHead } from '@vueuse/head'

export { useRoute, useRouter, RouterView as ReamView } from 'vue-router'

export * from './server-types'

export * from './link'

export const useRoutePath: () => ComputedRef<string>

export { ClientOnly, defineClientOnlyComponent } from './components/ClientOnly'
