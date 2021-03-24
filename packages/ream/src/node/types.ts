import { PluginContext } from './plugin-context'

export type ReamPlugin = {
  name: string

  apply?: (ctx: PluginContext) => void
}
