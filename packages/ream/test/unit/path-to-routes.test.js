"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_to_routes_1 = require("../../src/utils/path-to-routes");
test(`compile static paths to routes`, () => {
    const routes = path_to_routes_1.pathToRoutes(['bar/zoo.js', 'foo.vue'], '/pages');
    expect(routes).toMatchInlineSnapshot(`
    Array [
      Object {
        "absolutePath": "/pages/bar/zoo.js",
        "entryName": "pages/bar/zoo",
        "index": 0,
        "isApiRoute": false,
        "isClientRoute": true,
        "relativePath": "bar/zoo.js",
        "routePath": "/bar/zoo",
        "score": 14,
      },
      Object {
        "absolutePath": "/pages/foo.vue",
        "entryName": "pages/foo",
        "index": 1,
        "isApiRoute": false,
        "isClientRoute": true,
        "relativePath": "foo.vue",
        "routePath": "/foo",
        "score": 7,
      },
    ]
  `);
});
test('compile dynamic params', () => {
    const routes = path_to_routes_1.pathToRoutes(['[foo].vue'], '/pages');
    expect(routes).toMatchInlineSnapshot(`
    Array [
      Object {
        "absolutePath": "/pages/[foo].vue",
        "entryName": "pages/[foo]",
        "index": 0,
        "isApiRoute": false,
        "isClientRoute": true,
        "relativePath": "[foo].vue",
        "routePath": "/:foo",
        "score": 6,
      },
    ]
  `);
});
test('compile catchAll params', () => {
    const routes = path_to_routes_1.pathToRoutes(['[...foo].vue'], '/pages');
    expect(routes).toMatchInlineSnapshot(`
    Array [
      Object {
        "absolutePath": "/pages/[...foo].vue",
        "entryName": "pages/[...foo]",
        "index": 0,
        "isApiRoute": false,
        "isClientRoute": true,
        "relativePath": "[...foo].vue",
        "routePath": "/:foo(.*)",
        "score": -1,
      },
    ]
  `);
});
//# sourceMappingURL=path-to-routes.test.js.map