import path from 'path'
import MFS from 'memory-fs'
import { createRoutesLoader } from './load-routes'

const prepareFs = (files: string[]) => {
  const fs = new MFS()
  files.map((file) => {
    fs.mkdirpSync(path.dirname(file))
    fs.writeFileSync(file, '', 'utf8')
  })
  return fs
}

test('simple routes', () => {
  const loader = createRoutesLoader(
    '/o',
    prepareFs([
      '/o/index.vue',
      '/o/about.vue',
      '/o/profile.vue',
      '/o/hello.ts',
      '/o/graphql.js',
      '/o/api/posts.js',
    ])
  )
  const result = loader.load()
  expect(result).toMatchInlineSnapshot(`
    Object {
      "endpoints": Array [
        Object {
          "file": "/o/hello.ts",
          "isEndpoint": true,
          "name": "hello",
          "path": "/hello",
        },
        Object {
          "file": "/o/graphql.js",
          "isEndpoint": true,
          "name": "graphql",
          "path": "/graphql",
        },
        Object {
          "file": "/o/api/posts.js",
          "isEndpoint": true,
          "name": "api/posts",
          "path": "/api/posts",
        },
      ],
      "errorFile": undefined,
      "notFoundFile": undefined,
      "pages": Array [
        Object {
          "file": "/o/index.vue",
          "isEndpoint": false,
          "name": "index",
          "path": "/",
        },
        Object {
          "file": "/o/about.vue",
          "isEndpoint": false,
          "name": "about",
          "path": "/about",
        },
        Object {
          "file": "/o/profile.vue",
          "isEndpoint": false,
          "name": "profile",
          "path": "/profile",
        },
      ],
    }
  `)
})

test('error and 404 page', () => {
  const loader = createRoutesLoader(
    '/o',
    prepareFs(['/o/index.vue', '/o/404.vue', '/o/_error.vue'])
  )
  const result = loader.load()
  expect(result).toMatchInlineSnapshot(`
    Object {
      "endpoints": Array [],
      "errorFile": "/o/_error.vue",
      "notFoundFile": "/o/404.vue",
      "pages": Array [
        Object {
          "file": "/o/index.vue",
          "isEndpoint": false,
          "name": "index",
          "path": "/",
        },
      ],
    }
  `)
})

test('ignore files starting with underscore', () => {
  const loader = createRoutesLoader(
    '/o',
    prepareFs(['/o/_foo.vue', '/o/foo/bar/_baz.ts'])
  )
  const result = loader.load()
  expect(result).toMatchInlineSnapshot(`
    Object {
      "endpoints": Array [],
      "errorFile": undefined,
      "notFoundFile": undefined,
      "pages": Array [],
    }
  `)
})

describe('layout', () => {
  it('handles layout in root folder', () => {
    const loader = createRoutesLoader(
      '/o',
      prepareFs([
        '/o/index.vue',
        '/o/about.vue',
        '/o/profile.vue',
        '/o/_layout.vue',
      ])
    )
    const result = loader.load()
    expect(result).toMatchInlineSnapshot(`
      Object {
        "endpoints": Array [],
        "errorFile": undefined,
        "notFoundFile": undefined,
        "pages": Array [
          Object {
            "children": Array [
              Object {
                "file": "/o/index.vue",
                "isEndpoint": false,
                "name": "index",
                "path": "",
              },
              Object {
                "file": "/o/about.vue",
                "isEndpoint": false,
                "name": "about",
                "path": "about",
              },
              Object {
                "file": "/o/profile.vue",
                "isEndpoint": false,
                "name": "profile",
                "path": "profile",
              },
            ],
            "file": "/o/_layout.vue",
            "isEndpoint": false,
            "name": "_layout",
            "path": "/",
          },
        ],
      }
    `)
  })

  it('handles layout in nested routes', () => {
    const result = createRoutesLoader(
      '/o',
      prepareFs([
        '/o/index.vue',
        '/o/about.vue',
        '/o/foo/bar.vue',
        '/o/foo/baz.vue',
        '/o/foo/_layout.vue',
        '/o/foo/bar2/a.vue',
        '/o/foo/bar2/b.vue',
        '/o/foo/bar2/c.vue',
        '/o/foo/bar2/_layout.vue',
      ])
    ).load()
    expect(result).toMatchInlineSnapshot(`
      Object {
        "endpoints": Array [],
        "errorFile": undefined,
        "notFoundFile": undefined,
        "pages": Array [
          Object {
            "file": "/o/index.vue",
            "isEndpoint": false,
            "name": "index",
            "path": "/",
          },
          Object {
            "file": "/o/about.vue",
            "isEndpoint": false,
            "name": "about",
            "path": "/about",
          },
          Object {
            "children": Array [
              Object {
                "file": "/o/foo/bar.vue",
                "isEndpoint": false,
                "name": "foo/bar",
                "path": "bar",
              },
              Object {
                "file": "/o/foo/baz.vue",
                "isEndpoint": false,
                "name": "foo/baz",
                "path": "baz",
              },
              Object {
                "children": Array [
                  Object {
                    "file": "/o/foo/bar2/a.vue",
                    "isEndpoint": false,
                    "name": "foo/bar2/a",
                    "path": "a",
                  },
                  Object {
                    "file": "/o/foo/bar2/b.vue",
                    "isEndpoint": false,
                    "name": "foo/bar2/b",
                    "path": "b",
                  },
                  Object {
                    "file": "/o/foo/bar2/c.vue",
                    "isEndpoint": false,
                    "name": "foo/bar2/c",
                    "path": "c",
                  },
                ],
                "file": "/o/foo/bar2/_layout.vue",
                "isEndpoint": false,
                "name": "foo/bar2/_layout",
                "path": "bar2",
              },
            ],
            "file": "/o/foo/_layout.vue",
            "isEndpoint": false,
            "name": "foo/_layout",
            "path": "/foo",
          },
        ],
      }
    `)
  })

  it('handles endpoints', () => {
    const result = createRoutesLoader(
      '/o',
      prepareFs([
        '/o/index.vue',
        '/o/_layout.vue',
        '/o/foo.ts',
        '/o/foo/bar/index.vue',
        '/o/foo/bar/_layout.vue',
        '/o/foo/bar/api.ts',
      ])
    ).load()
    expect(result).toMatchInlineSnapshot(`
      Object {
        "endpoints": Array [
          Object {
            "file": "/o/foo.ts",
            "isEndpoint": true,
            "name": "foo",
            "path": "/foo",
          },
          Object {
            "file": "/o/foo/bar/api.ts",
            "isEndpoint": true,
            "name": "foo/bar/api",
            "path": "/foo/bar/api",
          },
        ],
        "errorFile": undefined,
        "notFoundFile": undefined,
        "pages": Array [
          Object {
            "children": Array [
              Object {
                "file": "/o/index.vue",
                "isEndpoint": false,
                "name": "index",
                "path": "",
              },
              Object {
                "children": Array [
                  Object {
                    "file": "/o/foo/bar/index.vue",
                    "isEndpoint": false,
                    "name": "foo/bar/index",
                    "path": "",
                  },
                ],
                "file": "/o/foo/bar/_layout.vue",
                "isEndpoint": false,
                "name": "foo/bar/_layout",
                "path": "foo/bar",
              },
            ],
            "file": "/o/_layout.vue",
            "isEndpoint": false,
            "name": "_layout",
            "path": "/",
          },
        ],
      }
    `)
  })
})
