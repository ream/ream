import { PreloadResult } from './server-types'

export const usePreloadData: <TData = any>() => TData

export const usePreloadResult: <TData = any>() => PreloadResult<TData>

export { useHead } from '@vueuse/head'

export { useRoute, useRouter } from 'vue-router'

export * from './server-types'

export * from './link'
