import { flattenRoutes } from './flatten-routes'

test('flatten routes', async () => {
  const routes = await flattenRoutes([
    { path: '/', component: () => ({}) },
    {
      path: '/docs',
      component: () => ({ $$preload: 'docs' }),
      children: [
        { path: 'foo', component: () => ({ $$preload: 'foo' }) },
        {
          path: 'bar',
          component: () => ({ $$preload: 'bar' }),
          children: [
            { path: 'a', component: () => ({ $$preload: 'a' }) },
            { path: 'b', component: () => ({ $$preload: 'b' }) },
          ],
        },
        { path: '', component: () => ({ $$preload: '' }) },
      ],
    },
  ])

  expect(routes).toMatchInlineSnapshot(`
    Array [
      Object {
        "matched": Array [
          Object {
            "getStaticPaths": undefined,
            "load": undefined,
            "preload": undefined,
          },
        ],
        "path": "/",
      },
      Object {
        "matched": Array [
          Object {
            "getStaticPaths": undefined,
            "load": undefined,
            "preload": "docs",
          },
          Object {
            "getStaticPaths": undefined,
            "load": undefined,
            "preload": "foo",
          },
        ],
        "path": "/docs/foo",
      },
      Object {
        "matched": Array [
          Object {
            "getStaticPaths": undefined,
            "load": undefined,
            "preload": "docs",
          },
          Object {
            "getStaticPaths": undefined,
            "load": undefined,
            "preload": "bar",
          },
          Object {
            "getStaticPaths": undefined,
            "load": undefined,
            "preload": "a",
          },
        ],
        "path": "/docs/bar/a",
      },
      Object {
        "matched": Array [
          Object {
            "getStaticPaths": undefined,
            "load": undefined,
            "preload": "docs",
          },
          Object {
            "getStaticPaths": undefined,
            "load": undefined,
            "preload": "bar",
          },
          Object {
            "getStaticPaths": undefined,
            "load": undefined,
            "preload": "b",
          },
        ],
        "path": "/docs/bar/b",
      },
      Object {
        "matched": Array [
          Object {
            "getStaticPaths": undefined,
            "load": undefined,
            "preload": "docs",
          },
          Object {
            "getStaticPaths": undefined,
            "load": undefined,
            "preload": "",
          },
        ],
        "path": "/docs",
      },
    ]
  `)
})
