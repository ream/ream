import type { Connect } from './connect'
import type { ReamServerRequest, ReamServerResponse } from './server'

/**
 * Hook: `extendServer`
 */
export type ExtendServer = (context: {
  server: Connect<ReamServerRequest, ReamServerResponse>
}) => void | Promise<void>

type GetInitialHTMLContext = {
  head: string
  main: string
  scripts: string
  htmlAttrs: string
  bodyAttrs: string
}

/**
 * Hook: `getInitialHTML`
 */
export type GetInitialHTML = (
  context: GetInitialHTMLContext
) => string | undefined | Promise<string | undefined>
