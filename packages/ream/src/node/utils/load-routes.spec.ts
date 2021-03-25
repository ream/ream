import { filesToRoutes } from './load-routes'

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
          'isEndpoint': false
        },
        {
          'name': 'about',
          'path': '/about',
          'file': '/routes/about.vue',
          'isEndpoint': false
        },
        {
          'name': 'settings/a',
          'path': '/settings/a',
          'file': '/routes/settings/a.vue',
          'isEndpoint': false,
          'children': [
            {
              'name': 'settings/a/b',
              'path': 'b',
              'file': '/routes/settings/a/b.vue',
              'isEndpoint': false
            },
            {
              'name': 'settings/a/c',
              'path': 'c',
              'file': '/routes/settings/a/c.vue',
              'isEndpoint': false
            }
          ]
        },
        {
          'name': 'welcome/index',
          'path': '/welcome',
          'file': '/routes/welcome/index.vue',
          'isEndpoint': false
        },
        {
          'name': 'welcome/a',
          'path': '/welcome/a',
          'file': '/routes/welcome/a.vue',
          'isEndpoint': false
        },
        {
          'name': 'deep/nested/route',
          'path': '/deep/nested/route',
          'file': '/routes/deep/nested/route.vue',
          'isEndpoint': false,
          'children': [
            {
              'name': 'deep/nested/route/index',
              'path': '',
              'file': '/routes/deep/nested/route/index.vue',
              'isEndpoint': false
            },
            {
              'name': 'deep/nested/route/a',
              'path': 'a',
              'file': '/routes/deep/nested/route/a.vue',
              'isEndpoint': false
            },
            {
              'name': 'deep/nested/route/b',
              'path': 'b',
              'file': '/routes/deep/nested/route/b.vue',
              'isEndpoint': false
            },
            {
              'name': 'deep/nested/route/c',
              'path': 'c',
              'file': '/routes/deep/nested/route/c.vue',
              'isEndpoint': false
            }
          ]
        },
        {
          'name': 'api/index',
          'path': '/api',
          'file': '/routes/api/index.ts',
          'isEndpoint': true
        },
        {
          'name': 'api/foo/index',
          'path': '/api/foo',
          'file': '/routes/api/foo/index.ts',
          'isEndpoint': true
        },
        {
          'name': 'api/foo/bar',
          'path': '/api/foo/bar',
          'file': '/routes/api/foo/bar.ts',
          'isEndpoint': true
        },
        {
          'name': 'api/foo',
          'path': '/api/foo',
          'file': '/routes/api/foo.ts',
          'isEndpoint': true
        }
      ]
    }"
  `)
})
