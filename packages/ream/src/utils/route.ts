export type Route = {
  routePath: string
  entryName: string
  absolutePath: string
  relativePath: string
  isClientRoute: boolean
  isServerRoute: boolean
  index: number
  score: number
  is404: boolean
}
