import { EntryContext } from 'ream/app'
import { createApp } from '@ream/framework-vue'

export default (context: EntryContext) => {
  return createApp({
    routes: context.routes,
  })
}
