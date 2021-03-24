import { ComponentPublicInstance } from 'vue'
import { Router } from 'vue-router'

export type ExtendApp = (context: {
  router: Router
  app: ComponentPublicInstance
  initialState: any
}) => void | Promise<void>

export type ExtendRouter = (context: { router: Router }) => void | Promise<void>
