import { LRU } from './lru'

test('lru', () => {
  const cache = new LRU({ max: 3 })
  cache.set('a', 1)
  cache.set('b', 2)
  cache.set('c', 3)
  cache.set('d', 4)
  expect(cache.size).toBe(3)
  expect(cache.get('a')).toBe(undefined)
  expect(cache.last).toEqual(cache.items.d)

  expect(cache.get('c')).toBe(3)
  cache.delete('c')
  expect(cache.get('c')).toBe(undefined)

  // update
  cache.set('b', 'b')
  expect(cache.last).toEqual(cache.items.b)
})

const sleep = (timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  })
}

test('lru ttl', async () => {
  const cache = new LRU({ ttl: 3 })
  cache.set('a', 1)
  await sleep(4)
  expect(cache.size).toBe(1)
  expect(cache.get('a')).toBe(undefined)
  expect(cache.size).toBe(0)
})
