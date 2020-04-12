const SEGMENT_POINTS = 4
const STATIC_POINTS = 3
const DYNAMIC_POINTS = 2
const SPLAT_PENALTY = 1
const ROOT_POINTS = 10000

const paramRe = /^:(.+)/

const segmentize = (uri: string) =>
  uri
    // strip starting/ending slashes
    .replace(/(^\/+|\/+$)/g, '')
    .split('/')

const isRootSegment = (segment: string) => segment === ''

const isDynamic = (segment: string) => paramRe.test(segment)
const isSplat = (segment: string) => segment.includes('(.*)')

export function rankRoute(route: string) {
  return segmentize(route).reduce((score, segment) => {
    score += SEGMENT_POINTS
    if (isRootSegment(segment)) {
      score += ROOT_POINTS
    } else if (isSplat(segment)) {
      score -= SEGMENT_POINTS + SPLAT_PENALTY
    } else if (isDynamic(segment)) {
      score += DYNAMIC_POINTS
    } else {
      score += STATIC_POINTS
    }
    return score
  }, 0)
}
