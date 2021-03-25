import type { RouteRecordRaw } from 'vue-router'
import type { GetStaticPaths, Load, Preload } from '../server'

export const flattenRoutes = async (
  routes: RouteRecordRaw[],
  parentPath = ''
) => {
  const result: {
    path: string
    matched: {
      load?: Load
      preload?: Preload
      getStaticPaths?: GetStaticPaths
    }[]
  }[] = []

  for (const route of routes) {
    const component =
      // @ts-expect-error
      typeof route.component === 'function' ? await route.component() : {}

    const path = [parentPath, route.path].filter(Boolean).join('/')
    const page = {
      load: component.$$load,
      preload: component.$$preload,
      getStaticPaths: component.$$getStaticPaths,
    }

    if (route.children) {
      const childRoutes = await flattenRoutes(route.children, path)
      result.push(
        ...childRoutes.map((r) => {
          r.matched.unshift(page)
          return r
        })
      )
    } else {
      result.push({ path, matched: [page] })
    }
  }

  return result
}
