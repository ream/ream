import { makeNestedRoutes } from './routes'

test('makeNestedRoutes', () => {
  const routes = makeNestedRoutes([
    { name: 'home', path: '/', file: '' },
    { name: 'about', path: '/about', file: '' },
    { name: 'about-work', path: '/about/work', file: '' },
    { name: 'about-haha', path: '/about/haha', file: '' },
    { name: 'about-a-b', path: '/about/a/b', file: '' },
    { name: 'about-a-b-c', path: '/about/a/b/c', file: '' },
    { name: 'about-a-b-index', path: '/about/a/b/index', file: '' },
  ])

  expect(routes).toMatchInlineSnapshot(`
    Object {
      "routes": Array [
        Object {
          "_nest_key_": "index",
          "file": "",
          "name": "home",
          "path": "/",
        },
        Object {
          "_nest_key_": "about",
          "children": Array [
            Object {
              "_nest_key_": "about/work",
              "file": "",
              "name": "about-work",
              "path": "work",
            },
            Object {
              "_nest_key_": "about/haha",
              "file": "",
              "name": "about-haha",
              "path": "haha",
            },
            Object {
              "_nest_key_": "about/a/b",
              "children": Array [
                Object {
                  "_nest_key_": "about/a/b/c",
                  "file": "",
                  "name": "about-a-b-c",
                  "path": "c",
                },
                Object {
                  "_nest_key_": "about/a/b/index",
                  "file": "",
                  "name": "about-a-b-index",
                  "path": "",
                },
              ],
              "file": "",
              "name": "about-a-b",
              "path": "a/b",
            },
          ],
          "file": "",
          "name": "about",
          "path": "/about",
        },
      ],
    }
  `)
})
