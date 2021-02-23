/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
import { ParsedUrlQuery } from 'querystring';
import { NextFunction, Connect } from './connect';
import { SendData } from './response-helpers';
export declare type ReamServerHandler = (req: ReamServerRequest, res: ReamServerResponse, next: NextFunction) => any;
export interface ReamServerRequest extends IncomingMessage {
    url: string;
    path: string;
    query: ParsedUrlQuery;
    params: {
        [k: string]: any;
    };
    _ssrInfo: {
        ssrManifest: any;
    };
}
export interface ReamServerResponse extends ServerResponse {
    send: (data: SendData) => void;
}
declare type ReamServerErrorHandler = (err: Error, req: ReamServerRequest, res: ReamServerResponse, next: NextFunction) => void;
export declare class Server {
    app: Connect;
    constructor();
    use(path: string, ...handlers: ReamServerHandler[]): void;
    use(...handlers: ReamServerHandler[]): void;
    onError(errorHandler: ReamServerErrorHandler): void;
    get handler(): Connect;
}
export {};
