import { ReamPlugin } from 'ream'

declare const ga: ({ trackingId, anonymizeIp }: Options) => ReamPlugin

declare type Options = {
  trackingId: string
  anonymizeIp?: boolean | undefined
}

export { Options }

export = ga
