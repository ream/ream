import {join} from 'path'

/**
 * Read routes.json
 * @param buildDir The absolute path to .ream directory
 */
export function prodReadRoutes(buildDir: string) {
  return require(join(buildDir, `routes.json`))
}