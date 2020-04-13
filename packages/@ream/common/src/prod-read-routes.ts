import {join} from 'path'
import { Route } from './route'

/**
 * Read routes.json
 * @param buildDir The absolute path to .ream directory
 */
export function prodReadRoutes(buildDir: string): Route[] {
  return require(join(buildDir, `routes.json`))
}