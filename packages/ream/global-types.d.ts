declare interface ImportMeta {
  env: {
    SSR: boolean
    MODE: string
    PROD: boolean
    DEV: boolean
  }
}

declare const REAM_SSR_ENABLED: boolean
