import { flattenRoutes } from './flatten-routes'

test('flatten routes', async () => {
  const routes = await flattenRoutes([
    { path: '/', component: () => ({}) },
    {
      path: '/docs',
      component: () => ({ $$staticPreload: 'docs' }),
      children: [
        { path: 'foo', component: () => ({ $$staticPreload: 'foo' }) },
        {
          path: 'bar',
          component: () => ({ $$staticPreload: 'bar' }),
          children: [
            { path: 'a', component: () => ({ $$staticPreload: 'a' }) },
            { path: 'b', component: () => ({ $$staticPreload: 'b' }) },
          ],
        },
        { path: '', component: () => ({ $$staticPreload: '' }) },
      ],
    },
  ])

  expect(routes).toMatchInlineSnapshot(`
    Array [
      Object {
        "matched": Array [
          Object {
            "getStaticPaths": undefined,
            "preload": undefined,
            "staticPreload": undefined,
          },
        ],
        "path": "/",
      },
      Object {
        "matched": Array [
          Object {
            "getStaticPaths": undefined,
            "preload": undefined,
            "staticPreload": "docs",
          },
          Object {
            "getStaticPaths": undefined,
            "preload": undefined,
            "staticPreload": "foo",
          },
        ],
        "path": "/docs/foo",
      },
      Object {
        "matched": Array [
          Object {
            "getStaticPaths": undefined,
            "preload": undefined,
            "staticPreload": "docs",
          },
          Object {
            "getStaticPaths": undefined,
            "preload": undefined,
            "staticPreload": "bar",
          },
          Object {
            "getStaticPaths": undefined,
            "preload": undefined,
            "staticPreload": "a",
          },
        ],
        "path": "/docs/bar/a",
      },
      Object {
        "matched": Array [
          Object {
            "getStaticPaths": undefined,
            "preload": undefined,
            "staticPreload": "docs",
          },
          Object {
            "getStaticPaths": undefined,
            "preload": undefined,
            "staticPreload": "bar",
          },
          Object {
            "getStaticPaths": undefined,
            "preload": undefined,
            "staticPreload": "b",
          },
        ],
        "path": "/docs/bar/b",
      },
      Object {
        "matched": Array [
          Object {
            "getStaticPaths": undefined,
            "preload": undefined,
            "staticPreload": "docs",
          },
          Object {
            "getStaticPaths": undefined,
            "preload": undefined,
            "staticPreload": "",
          },
        ],
        "path": "/docs",
      },
    ]
  `)
})
