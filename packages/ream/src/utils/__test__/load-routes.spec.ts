import { filesToRoutes } from '../load-routes'

test('build routes', async () => {
  const routes = filesToRoutes(
    [
      'index.vue',
      'about.vue',

      // These should be grouped
      'settings/a.vue',
      'settings/a/b.vue',
      'settings/a/c.vue',

      // These should not be grouped
      'welcome/index.vue',
      'welcome/a.vue',

      // These should be grouped
      'deep/nested/route.vue',
      'deep/nested/route/index.vue',
      'deep/nested/route/a.vue',
      'deep/nested/route/b.vue',
      'deep/nested/route/c.vue',

      // Server routes
      'api/index.ts',
      'api/foo/index.ts',
      'api/foo/bar.ts',
      'api/foo.ts',
    ],
    '/routes'
  )
  expect(routes).toMatchInlineSnapshot(`
    Array [
      Object {
        "children": undefined,
        "file": "/routes/index.vue",
        "isServerRoute": false,
        "name": "index",
        "path": "/",
      },
      Object {
        "children": undefined,
        "file": "/routes/about.vue",
        "isServerRoute": false,
        "name": "about",
        "path": "/about",
      },
      Object {
        "children": Array [
          Object {
            "children": undefined,
            "file": "/routes/settings/a/b.vue",
            "isServerRoute": false,
            "name": "settings-a-b",
            "path": "b",
          },
          Object {
            "children": undefined,
            "file": "/routes/settings/a/c.vue",
            "isServerRoute": false,
            "name": "settings-a-c",
            "path": "c",
          },
        ],
        "file": "/routes/settings/a.vue",
        "isServerRoute": false,
        "name": "settings-a",
        "path": "/settings/a",
      },
      Object {
        "children": undefined,
        "file": "/routes/welcome/index.vue",
        "isServerRoute": false,
        "name": "welcome-index",
        "path": "/welcome",
      },
      Object {
        "children": undefined,
        "file": "/routes/welcome/a.vue",
        "isServerRoute": false,
        "name": "welcome-a",
        "path": "/welcome/a",
      },
      Object {
        "children": Array [
          Object {
            "children": undefined,
            "file": "/routes/deep/nested/route/index.vue",
            "isServerRoute": false,
            "name": "deep-nested-route-index",
            "path": "",
          },
          Object {
            "children": undefined,
            "file": "/routes/deep/nested/route/a.vue",
            "isServerRoute": false,
            "name": "deep-nested-route-a",
            "path": "a",
          },
          Object {
            "children": undefined,
            "file": "/routes/deep/nested/route/b.vue",
            "isServerRoute": false,
            "name": "deep-nested-route-b",
            "path": "b",
          },
          Object {
            "children": undefined,
            "file": "/routes/deep/nested/route/c.vue",
            "isServerRoute": false,
            "name": "deep-nested-route-c",
            "path": "c",
          },
        ],
        "file": "/routes/deep/nested/route.vue",
        "isServerRoute": false,
        "name": "deep-nested-route",
        "path": "/deep/nested/route",
      },
      Object {
        "children": undefined,
        "file": "/routes/api/index.ts",
        "isServerRoute": true,
        "name": "api-index",
        "path": "/api",
      },
      Object {
        "children": undefined,
        "file": "/routes/api/foo/index.ts",
        "isServerRoute": true,
        "name": "api-foo-index",
        "path": "/api/foo",
      },
      Object {
        "children": undefined,
        "file": "/routes/api/foo/bar.ts",
        "isServerRoute": true,
        "name": "api-foo-bar",
        "path": "/api/foo/bar",
      },
      Object {
        "children": undefined,
        "file": "/routes/api/foo.ts",
        "isServerRoute": true,
        "name": "api-foo",
        "path": "/api/foo",
      },
    ]
  `)
})
