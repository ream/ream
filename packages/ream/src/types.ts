import { Store } from './store'

export type ReamPlugin = {
  name: string
  apply?: (api: Store) => void
}
