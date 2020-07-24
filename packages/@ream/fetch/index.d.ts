export interface FetchError extends Error {
  response: Response
}
/**
 * An enhanced version of `window.fetch`, available on server-side as well
 * When the request fails, i.e. `res.ok === false`
 * It throws immediately, you can `.catch` it and inspect `err.response`
 * `response` is just a Fetch [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * If you're using TypeScript, you can type the error:
 * ```ts
 * import { fetch, FetchError } from 'ream/fetch'
 *
 * fetch('/').catch((err: FetchError) => {
 *   // handle error
 *   // console.log(err.response.status)
 * })
 * ```
 */
export type ReamFetch = (
  url: string,
  options?: RequestInit
) => Promise<Response>

export const fetch: ReamFetch
