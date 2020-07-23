import { watchEffect, App, inject } from 'vue'

const PROVIDE_KEY = `__head__`

export interface HeadObject {
  title?: string
}

const canUseDOM = typeof window !== 'undefined' && window.document

export class Head {
  data: {
    title: string
  }

  constructor() {
    this.data = {
      title: '',
    }
  }

  install(app: App) {
    app.config.globalProperties.$head = this
    app.provide(PROVIDE_KEY, this)
  }

  get title() {
    return {
      toString: () => `<title>${this.data.title}</title>`,
    }
  }
}

export const useHead = (fn: () => HeadObject) => {
  if (canUseDOM) {
    const effect = () => {
      const obj = fn()
      if (typeof obj.title === 'string') {
        document.title = obj.title
      }
    }
    watchEffect(effect)
  } else {
    const head = inject<Head>(PROVIDE_KEY)
    if (!head) {
      throw new Error(`You may forget to apply app.use(head)`)
    }
    const obj = fn()
    if (typeof obj.title === 'string') {
      head.data.title = obj.title
    }
  }
}

export const createHead = () => new Head()
