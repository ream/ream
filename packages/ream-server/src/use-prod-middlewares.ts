import { join } from 'path'
import express, { Express } from 'express'

export function useProdMiddlewares(server: Express, buildDir: string) {
  server.use('/_ream', express.static(join(buildDir, 'client')))
}
