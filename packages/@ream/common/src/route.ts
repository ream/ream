export type Route = {
  routePath: string
  entryName: string
  absolutePath: string
  relativePath: string
  isClientRoute: boolean
  isApiRoute: boolean
  index: number
  score: number
  is404: boolean
}