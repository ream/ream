export type Route = {
  name?: string
  path: string
  file: string
  isServerRoute: boolean
  children?: Route[]
}
