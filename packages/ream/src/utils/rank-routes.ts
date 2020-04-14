import { Route } from '@ream/common/dist/route'

const SEGMENT_POINTS = 4
const STATIC_POINTS = 3
const DYNAMIC_POINTS = 2
const CATCH_ALL_PENALTY = 1
const ROOT_POINTS = 10000
const NOT_FOUND_PENALTY = 10000

const paramRe = /^:(.+)/

const segmentize = (uri: string) =>
  uri
    // strip starting/ending slashes
    .replace(/(^\/+|\/+$)/g, '')
    .split('/')

const isRootSegment = (segment: string) => segment === ''

const isDynamic = (segment: string) => paramRe.test(segment)
const isCatchAll = (segment: string) =>
  segment.includes('(.*)') && !segment.startsWith(':404')
const isNotFound = (segment: string) => segment === ':404(.*)'

export function rankRoute(route: string) {
  return segmentize(route).reduce((score, segment) => {
    score += SEGMENT_POINTS
    if (isRootSegment(segment)) {
      score += ROOT_POINTS
    } else if (isNotFound(segment)) {
      score -= NOT_FOUND_PENALTY
    } else if (isCatchAll(segment)) {
      score -= SEGMENT_POINTS + CATCH_ALL_PENALTY
    } else if (isDynamic(segment)) {
      score += DYNAMIC_POINTS
    } else {
      score += STATIC_POINTS
    }
    return score
  }, 0)
}

export function sortRoutesByScore(routes: Route[]) {
  return routes.sort((a, b) => {
    return a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
  })
}
