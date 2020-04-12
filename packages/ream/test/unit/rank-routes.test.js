"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rank_routes_1 = require("../../src/utils/rank-routes");
test('rank routes', () => {
    expect(rank_routes_1.rankRoute(`/`)).toMatchInlineSnapshot(`10004`);
    expect(rank_routes_1.rankRoute(`/foo`)).toMatchInlineSnapshot(`7`);
    expect(rank_routes_1.rankRoute(`/:foo`)).toMatchInlineSnapshot(`6`);
    expect(rank_routes_1.rankRoute(`/foo/bar`)).toMatchInlineSnapshot(`14`);
    expect(rank_routes_1.rankRoute(`/foo/:bar`)).toMatchInlineSnapshot(`13`);
    expect(rank_routes_1.rankRoute(`/foo/:bar/:baz`)).toMatchInlineSnapshot(`19`);
    expect(rank_routes_1.rankRoute(`/:foo(.*)`)).toMatchInlineSnapshot(`-1`);
    expect(rank_routes_1.rankRoute(`/foo/:foo(.*)`)).toMatchInlineSnapshot(`6`);
    expect(rank_routes_1.rankRoute(`/foo/:bar/:foo(.*)`)).toMatchInlineSnapshot(`12`);
});
//# sourceMappingURL=rank-routes.test.js.map