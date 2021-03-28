import path from 'path'
import os from 'os'
import fs from 'fs'
import { createRoutesLoader } from './load-routes'
import { normalizePath } from './normalize-path'

const random = () => Math.random().toString(36).substring(7)

const loadRoutes = (files: string[]) => {
  const dirname = path.join(os.tmpdir(), `ream-${random()}`)

  files.forEach((file) => {
    const outpath = path.join(dirname, file)
    fs.mkdirSync(path.dirname(outpath), { recursive: true })
    fs.writeFileSync(outpath, '', 'utf8')
  })

  const dir = path.resolve(dirname)
  const loader = createRoutesLoader(dir)
  const result = loader.load()

  return JSON.stringify(result, null, 2).replace(
    new RegExp(normalizePath(dir), 'g'),
    ''
  )
}

test('simple routes', () => {
  const result = loadRoutes([
    'index.vue',
    'about.vue',
    'profile.vue',
    'hello.ts',
    'graphql.js',
    'api/posts.js',
  ])
  expect(result).toMatchInlineSnapshot(`
    "{
      \\"pages\\": [
        {
          \\"name\\": \\"about\\",
          \\"path\\": \\"/about\\",
          \\"isEndpoint\\": false,
          \\"file\\": \\"/about.vue\\"
        },
        {
          \\"name\\": \\"index\\",
          \\"path\\": \\"/\\",
          \\"isEndpoint\\": false,
          \\"file\\": \\"/index.vue\\"
        },
        {
          \\"name\\": \\"profile\\",
          \\"path\\": \\"/profile\\",
          \\"isEndpoint\\": false,
          \\"file\\": \\"/profile.vue\\"
        }
      ],
      \\"endpoints\\": [
        {
          \\"name\\": \\"api/posts\\",
          \\"path\\": \\"/api/posts\\",
          \\"isEndpoint\\": true,
          \\"file\\": \\"/api/posts.js\\"
        },
        {
          \\"name\\": \\"graphql\\",
          \\"path\\": \\"/graphql\\",
          \\"isEndpoint\\": true,
          \\"file\\": \\"/graphql.js\\"
        },
        {
          \\"name\\": \\"hello\\",
          \\"path\\": \\"/hello\\",
          \\"isEndpoint\\": true,
          \\"file\\": \\"/hello.ts\\"
        }
      ]
    }"
  `)
})

test('error and 404 page', () => {
  const result = loadRoutes(['index.vue', '404.vue', '_error.vue'])
  expect(result).toMatchInlineSnapshot(`
    "{
      \\"errorFile\\": \\"/_error.vue\\",
      \\"notFoundFile\\": \\"/404.vue\\",
      \\"pages\\": [
        {
          \\"name\\": \\"index\\",
          \\"path\\": \\"/\\",
          \\"isEndpoint\\": false,
          \\"file\\": \\"/index.vue\\"
        }
      ],
      \\"endpoints\\": []
    }"
  `)
})

test('ignore files starting with underscore', () => {
  const result = loadRoutes(['_foo.vue', 'foo/bar/_baz.ts'])
  expect(result).toMatchInlineSnapshot(`
    "{
      \\"pages\\": [],
      \\"endpoints\\": []
    }"
  `)
})

describe('layout', () => {
  it('handles layout in root folder', () => {
    const result = loadRoutes([
      'index.vue',
      'about.vue',
      'profile.vue',
      '_layout.vue',
    ])
    expect(result).toMatchInlineSnapshot(`
      "{
        \\"pages\\": [
          {
            \\"name\\": \\"_layout\\",
            \\"path\\": \\"/\\",
            \\"isEndpoint\\": false,
            \\"file\\": \\"/_layout.vue\\",
            \\"children\\": [
              {
                \\"name\\": \\"about\\",
                \\"path\\": \\"about\\",
                \\"isEndpoint\\": false,
                \\"file\\": \\"/about.vue\\"
              },
              {
                \\"name\\": \\"index\\",
                \\"path\\": \\"\\",
                \\"isEndpoint\\": false,
                \\"file\\": \\"/index.vue\\"
              },
              {
                \\"name\\": \\"profile\\",
                \\"path\\": \\"profile\\",
                \\"isEndpoint\\": false,
                \\"file\\": \\"/profile.vue\\"
              }
            ]
          }
        ],
        \\"endpoints\\": []
      }"
    `)
  })

  it('handles layout in nested routes', () => {
    const result = loadRoutes([
      'index.vue',
      'about.vue',
      'foo/bar.vue',
      'foo/baz.vue',
      'foo/_layout.vue',
      'foo/bar2/a.vue',
      'foo/bar2/b.vue',
      'foo/bar2/c.vue',
      'foo/bar2/index.vue',
      'foo/bar2/_layout.vue',
    ])
    expect(result).toMatchInlineSnapshot(`
      "{
        \\"pages\\": [
          {
            \\"name\\": \\"about\\",
            \\"path\\": \\"/about\\",
            \\"isEndpoint\\": false,
            \\"file\\": \\"/about.vue\\"
          },
          {
            \\"name\\": \\"foo/_layout\\",
            \\"path\\": \\"/foo\\",
            \\"isEndpoint\\": false,
            \\"file\\": \\"/foo/_layout.vue\\",
            \\"children\\": [
              {
                \\"name\\": \\"foo/bar\\",
                \\"path\\": \\"bar\\",
                \\"isEndpoint\\": false,
                \\"file\\": \\"/foo/bar.vue\\"
              },
              {
                \\"name\\": \\"foo/bar2/_layout\\",
                \\"path\\": \\"bar2\\",
                \\"isEndpoint\\": false,
                \\"file\\": \\"/foo/bar2/_layout.vue\\",
                \\"children\\": [
                  {
                    \\"name\\": \\"foo/bar2/a\\",
                    \\"path\\": \\"a\\",
                    \\"isEndpoint\\": false,
                    \\"file\\": \\"/foo/bar2/a.vue\\"
                  },
                  {
                    \\"name\\": \\"foo/bar2/b\\",
                    \\"path\\": \\"b\\",
                    \\"isEndpoint\\": false,
                    \\"file\\": \\"/foo/bar2/b.vue\\"
                  },
                  {
                    \\"name\\": \\"foo/bar2/c\\",
                    \\"path\\": \\"c\\",
                    \\"isEndpoint\\": false,
                    \\"file\\": \\"/foo/bar2/c.vue\\"
                  },
                  {
                    \\"name\\": \\"foo/bar2/index\\",
                    \\"path\\": \\"\\",
                    \\"isEndpoint\\": false,
                    \\"file\\": \\"/foo/bar2/index.vue\\"
                  }
                ]
              },
              {
                \\"name\\": \\"foo/baz\\",
                \\"path\\": \\"baz\\",
                \\"isEndpoint\\": false,
                \\"file\\": \\"/foo/baz.vue\\"
              }
            ]
          },
          {
            \\"name\\": \\"index\\",
            \\"path\\": \\"/\\",
            \\"isEndpoint\\": false,
            \\"file\\": \\"/index.vue\\"
          }
        ],
        \\"endpoints\\": []
      }"
    `)
  })

  it('handles endpoints', () => {
    const result = loadRoutes([
      'index.vue',
      '_layout.vue',
      'foo.ts',
      'foo/bar/index.vue',
      'foo/bar/_layout.vue',
      'foo/bar/api.ts',
    ])
    expect(result).toMatchInlineSnapshot(`
      "{
        \\"pages\\": [
          {
            \\"name\\": \\"_layout\\",
            \\"path\\": \\"/\\",
            \\"isEndpoint\\": false,
            \\"file\\": \\"/_layout.vue\\",
            \\"children\\": [
              {
                \\"name\\": \\"foo/bar/_layout\\",
                \\"path\\": \\"foo/bar\\",
                \\"isEndpoint\\": false,
                \\"file\\": \\"/foo/bar/_layout.vue\\",
                \\"children\\": [
                  {
                    \\"name\\": \\"foo/bar/index\\",
                    \\"path\\": \\"\\",
                    \\"isEndpoint\\": false,
                    \\"file\\": \\"/foo/bar/index.vue\\"
                  }
                ]
              },
              {
                \\"name\\": \\"index\\",
                \\"path\\": \\"\\",
                \\"isEndpoint\\": false,
                \\"file\\": \\"/index.vue\\"
              }
            ]
          }
        ],
        \\"endpoints\\": [
          {
            \\"name\\": \\"foo/bar/api\\",
            \\"path\\": \\"/foo/bar/api\\",
            \\"isEndpoint\\": true,
            \\"file\\": \\"/foo/bar/api.ts\\"
          },
          {
            \\"name\\": \\"foo\\",
            \\"path\\": \\"/foo\\",
            \\"isEndpoint\\": true,
            \\"file\\": \\"/foo.ts\\"
          }
        ]
      }"
    `)
  })
})
