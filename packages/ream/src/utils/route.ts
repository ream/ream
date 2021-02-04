export type Route = {
  name?: string
  routeName?: string
  path: string
  file: string
  isServerRoute: boolean
  children?: Route[]
}
