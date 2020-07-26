import { rankRoute } from 'ream/src/utils/rank-routes'

test('rank routes', () => {
  expect(rankRoute(`/`)).toMatchInlineSnapshot(`10004`)
  expect(rankRoute(`/foo`)).toMatchInlineSnapshot(`7`)
  expect(rankRoute(`/:foo`)).toMatchInlineSnapshot(`6`)
  expect(rankRoute(`/foo/bar`)).toMatchInlineSnapshot(`14`)
  expect(rankRoute(`/foo/:bar`)).toMatchInlineSnapshot(`13`)
  expect(rankRoute(`/foo/:bar/:baz`)).toMatchInlineSnapshot(`19`)
  expect(rankRoute(`/:foo(.*)`)).toMatchInlineSnapshot(`-1`)
  expect(rankRoute(`/foo/:foo(.*)`)).toMatchInlineSnapshot(`6`)
  expect(rankRoute(`/foo/:bar/:foo(.*)`)).toMatchInlineSnapshot(`12`)
  expect(rankRoute(`/:404(.*)`)).toMatchInlineSnapshot(`-9996`)
})
