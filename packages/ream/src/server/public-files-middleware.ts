import { join } from 'path'
import serveStatic from 'serve-static'
import { ReamServerHandler } from "..";
import { Ream } from "../node";

export function createPublicFilesMiddleware(api: Ream): ReamServerHandler {
  const publicFiles = join(api.resolveDir('./'), 'public')
  const publicHandler = serveStatic(publicFiles)

  return (req, _res, next) => {
    return publicHandler(req as any, _res as any, next)
  }
}