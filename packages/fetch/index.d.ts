/**
 * An enhanced version of `window.fetch`, available on server-side as well
 */
export type ReamFetch = (
  url: string,
  options?: RequestInit
) => Promise<Response>

export const fetch: ReamFetch
