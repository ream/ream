import { Ream } from "..";
import express, {Express} from 'express'

export function useProdMiddlewares(api: Ream, server: Express) {
  server.use('/_ream', express.static(api.resolveDotReam('client')))
}