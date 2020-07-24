type Options = {
  maxConcurrent?: number
  retry?: boolean
}

type ProcessCallback = (job: string, ...args: any[]) => void | Promise<void>

export class PromiseQueue {
  process: ProcessCallback
  maxConcurrent: number
  retry: boolean
  queue: Array<[string, any[]]>
  processing: Set<string>
  processed: Set<string>
  numRunning: number
  runPromise: Promise<Set<string>> | null
  resolve: ((processed: Set<string>) => void) | null
  reject: ((error: Error) => void) | null

  constructor(callback: ProcessCallback, options: Options = {}) {
    this.process = callback
    this.maxConcurrent = options.maxConcurrent || Infinity
    this.retry = options.retry !== false
    this.queue = []
    this.processing = new Set()
    this.processed = new Set()
    this.numRunning = 0
    this.runPromise = null
    this.resolve = null
    this.reject = null
  }

  add(job: string, ...args: any[]) {
    if (this.processing.has(job) || this.processed.has(job)) {
      return
    }

    if (this.runPromise && this.numRunning < this.maxConcurrent) {
      this._runJob(job, args)
    } else {
      this.queue.push([job, args])
    }

    this.processing.add(job)
  }

  run() {
    if (this.runPromise) {
      return this.runPromise
    }

    const runPromise = new Promise<Set<string>>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })

    this.runPromise = runPromise
    this._next()

    return runPromise
  }

  async _runJob(job: string, args: any[]) {
    try {
      this.numRunning++
      await this.process(job, ...args)
      this.processing.delete(job)
      this.processed.add(job)
      this.numRunning--
      this._next()
    } catch (err) {
      this.numRunning--
      if (this.retry) {
        this.queue.push([job, args])
      } else {
        this.processing.delete(job)
      }

      if (this.reject) {
        this.reject(err)
      }

      this._reset()
    }
  }

  _next() {
    if (!this.runPromise) {
      return
    }

    if (this.queue.length > 0) {
      while (this.queue.length > 0 && this.numRunning < this.maxConcurrent) {
        this._runJob(...this.queue.shift()!)
      }
    } else if (this.processing.size === 0) {
      this.resolve!(this.processed)
      this._reset()
    }
  }

  _reset() {
    this.processed = new Set()
    this.runPromise = null
    this.resolve = null
    this.reject = null
  }
}
