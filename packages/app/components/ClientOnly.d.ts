import {
  DefineComponent,
  defineAsyncComponent,
  AsyncComponentLoader,
} from 'vue'

export const ClientOnly: DefineComponent<{}>

type DefineClientOnlyComponent<T = any> = (
  source: AsyncComponentLoader<T>
) => DefineComponent<{}>

export const defineClientOnlyComponent: DefineClientOnlyComponent
