import { pathToRoutes } from 'ream/src/utils/path-to-routes'

test(`compile static paths to routes`, () => {
  const routes = pathToRoutes(['bar/zoo.js', 'foo.vue'], '/routes')
  expect(routes).toMatchInlineSnapshot(`
    Array [
      Object {
        "absolutePath": "/routes/bar/zoo.js",
        "entryName": "routes/bar/zoo",
        "index": 0,
        "is404": false,
        "isClientRoute": true,
        "isServerRoute": false,
        "relativePath": "bar/zoo.js",
        "routePath": "/bar/zoo",
        "score": 14,
      },
      Object {
        "absolutePath": "/routes/foo.vue",
        "entryName": "routes/foo",
        "index": 1,
        "is404": false,
        "isClientRoute": true,
        "isServerRoute": false,
        "relativePath": "foo.vue",
        "routePath": "/foo",
        "score": 7,
      },
    ]
  `)
})

test('compile dynamic params', () => {
  const routes = pathToRoutes(['[foo].vue'], '/routes')
  expect(routes).toMatchInlineSnapshot(`
    Array [
      Object {
        "absolutePath": "/routes/[foo].vue",
        "entryName": "routes/[foo]",
        "index": 0,
        "is404": false,
        "isClientRoute": true,
        "isServerRoute": false,
        "relativePath": "[foo].vue",
        "routePath": "/:foo",
        "score": 6,
      },
    ]
  `)
})

test('compile catchAll params', () => {
  const routes = pathToRoutes(['[...foo].vue'], '/routes')
  expect(routes).toMatchInlineSnapshot(`
    Array [
      Object {
        "absolutePath": "/routes/[...foo].vue",
        "entryName": "routes/[...foo]",
        "index": 0,
        "is404": false,
        "isClientRoute": true,
        "isServerRoute": false,
        "relativePath": "[...foo].vue",
        "routePath": "/:foo(.*)",
        "score": -1,
      },
    ]
  `)
})
