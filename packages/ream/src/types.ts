import { Store } from './store'

export type ReamPlugin<T = any> = {
  config?: {
    name?: string
  }
  apply?: (api: Store, options: T) => void
}
