export interface PreloadContext {
  params: {
    [k: string]: string
  }
}

export type PreloadResult = {
  props: {
    [k: string]: any
  }
}

export type PreloadFunction = (
  ctx: PreloadContext
) => PreloadResult | Promise<PreloadResult>
