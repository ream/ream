type Options = { max?: number; ttl?: number }

interface CacheItem<ValueType> {
  key: string
  expiry: number
  ttl: number
  prev: CacheItem<ValueType> | null
  next: CacheItem<ValueType> | null
  value: ValueType
}

export class LRU<ValueType> {
  first: CacheItem<ValueType> | null
  last: CacheItem<ValueType> | null
  items: { [k: string]: CacheItem<ValueType> }
  private max: number
  size: number
  private ttl: number

  constructor(options: Options = {}) {
    this.first = null
    this.items = Object.create(null)
    this.last = null
    this.max = options.max || 0
    this.size = 0
    this.ttl = options.ttl || 0
  }

  has(key: string) {
    return this.items[key] !== undefined
  }

  clear() {
    this.first = null
    this.items = Object.create(null)
    this.last = null
    this.size = 0
  }

  delete(key: string) {
    if (this.has(key)) {
      const item = this.items[key]

      delete this.items[key]
      this.size--

      if (item.prev !== null) {
        item.prev.next = item.next
      }

      if (item.next !== null) {
        item.next.prev = item.prev
      }

      if (this.first === item) {
        this.first = item.next
      }

      if (this.last === item) {
        this.last = item.prev
      }
    }
  }

  evict() {
    if (this.first) {
      const key = this.first.key
      this.first = this.first.next
      if (this.first) {
        this.first.prev = null
      }
      delete this.items[key]
      this.size--
    }
  }

  get(key: string) {
    const item = this.items[key]

    if (item) {
      if (item.ttl > 0 && item.expiry <= Date.now()) {
        this.delete(key)
      } else {
        // Move to front
        this.set(key, item.value, item.ttl, true)
        return item.value
      }
    }
  }

  keys() {
    return Object.keys(this.items)
  }

  set(key: string, value: ValueType, ttl = this.ttl, bypassChecking = false) {
    let item = this.items[key]

    if (bypassChecking || item !== undefined) {
      item.value = value

      // Update expiry
      if (bypassChecking === false) {
        item.expiry = ttl > 0 ? Date.now() + ttl : ttl
      }

      if (this.last && this.last !== item) {
        const last = this.last,
          next = item.next,
          prev = item.prev

        if (this.first === item) {
          this.first = item.next
        }

        item.next = null
        item.prev = this.last
        last.next = item

        if (prev !== null) {
          prev.next = next
        }

        if (next !== null) {
          next.prev = prev
        }
      }
    } else {
      if (this.max > 0 && this.size === this.max) {
        this.evict()
      }

      item = {
        ttl,
        expiry: ttl > 0 ? Date.now() + ttl : ttl,
        key: key,
        prev: this.last,
        next: null,
        value,
      }

      this.items[key] = item

      if (++this.size === 1) {
        this.first = item
      } else if (this.last) {
        this.last.next = item
      }
    }

    this.last = item
  }
}
