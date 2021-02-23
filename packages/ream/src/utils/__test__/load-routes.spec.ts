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
  expect(
    JSON.stringify(routes, null, 2)
      .replace(/"/g, "'")
      .replace(new RegExp(process.cwd(), 'g'), '$CWD')
  ).toMatchInlineSnapshot(`
    "{
      'routes': [
        {
          'name': 'index',
          'path': '/',
          'file': '/routes/index.vue',
          'isServerRoute': false
        },
        {
          'name': 'about',
          'path': '/about',
          'file': '/routes/about.vue',
          'isServerRoute': false
        },
        {
          'name': 'settings-a',
          'path': '/settings/a',
          'file': '/routes/settings/a.vue',
          'isServerRoute': false,
          'children': [
            {
              'name': 'settings-a-b',
              'path': 'b',
              'file': '/routes/settings/a/b.vue',
              'isServerRoute': false
            },
            {
              'name': 'settings-a-c',
              'path': 'c',
              'file': '/routes/settings/a/c.vue',
              'isServerRoute': false
            }
          ]
        },
        {
          'name': 'welcome-index',
          'path': '/welcome',
          'file': '/routes/welcome/index.vue',
          'isServerRoute': false
        },
        {
          'name': 'welcome-a',
          'path': '/welcome/a',
          'file': '/routes/welcome/a.vue',
          'isServerRoute': false
        },
        {
          'name': 'deep-nested-route',
          'path': '/deep/nested/route',
          'file': '/routes/deep/nested/route.vue',
          'isServerRoute': false,
          'children': [
            {
              'name': 'deep-nested-route-index',
              'path': '',
              'file': '/routes/deep/nested/route/index.vue',
              'isServerRoute': false
            },
            {
              'name': 'deep-nested-route-a',
              'path': 'a',
              'file': '/routes/deep/nested/route/a.vue',
              'isServerRoute': false
            },
            {
              'name': 'deep-nested-route-b',
              'path': 'b',
              'file': '/routes/deep/nested/route/b.vue',
              'isServerRoute': false
            },
            {
              'name': 'deep-nested-route-c',
              'path': 'c',
              'file': '/routes/deep/nested/route/c.vue',
              'isServerRoute': false
            }
          ]
        },
        {
          'name': 'api-index',
          'path': '/api',
          'file': '/routes/api/index.ts',
          'isServerRoute': true
        },
        {
          'name': 'api-foo-index',
          'path': '/api/foo',
          'file': '/routes/api/foo/index.ts',
          'isServerRoute': true
        },
        {
          'name': 'api-foo-bar',
          'path': '/api/foo/bar',
          'file': '/routes/api/foo/bar.ts',
          'isServerRoute': true
        },
        {
          'name': 'api-foo',
          'path': '/api/foo',
          'file': '/routes/api/foo.ts',
          'isServerRoute': true
        }
      ],
      'appFile': '$CWD/packages/app/pages/_app.js',
      'documentFile': '$CWD/packages/app/pages/_document.js',
      'errorFile': '$CWD/packages/app/pages/_error.js',
      'notFoundFile': '$CWD/packages/app/pages/404.js'
    }"
  `)
})
